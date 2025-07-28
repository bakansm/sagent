/* eslint-disable */

import { PROMPT } from "@/constants/prompt.constant";
import { env } from "@/env";
import { db } from "@/libs/db.lib";
import { mastra } from "@/mastra";
import Sandbox from "@e2b/code-interpreter";
import {
  createAgent,
  createNetwork,
  createTool,
  gemini,
  type Tool,
} from "@inngest/agent-kit";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { z } from "zod";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

interface AgentState {
  summary: string;
  files: Record<string, string>;
}

export const callAgent = inngest.createFunction(
  { id: "call-agent-corrected" },
  { event: "agent/call" },
  async ({ event, step }) => {
    const initialMessage = await step.run("setup-environment", () => {
      return db.message.create({
        data: {
          content: "Setting up environment...",
          role: "ASSISTANT",
          type: "TEXT",
          status: "PROCESSING",
          threadId: event.data.threadId,
          userId: event.data.userId,
          fragments: {
            create: {
              sandboxId: "",
              sandboxUrl: "",
              title: "Sandbox Info",
              files: {},
            },
          },
        },
      });
    });
    const initialMessageId = initialMessage.id;

    const sandboxId = await step.run("create-sandbox", async () => {
      await db.message.update({
        where: { id: initialMessageId },
        data: { content: "Provisioning a secure cloud sandbox..." },
      });

      const sandbox = await Sandbox.create("sagent-nextjs", {
        timeoutMs: 1000 * 60 * 60, // 1 hour
        apiKey: env.E2B_API_KEY,
      });

      // We only need the sandbox ID and host. The getSandbox utility will reconnect as needed.
      const host = sandbox.getHost(3000);

      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Sandbox ready. Starting agent...",
          fragments: {
            update: {
              sandboxId: sandbox.sandboxId,
              sandboxUrl: `https://${host ?? ""}`,
            },
          },
        },
      });
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      system: PROMPT.SYSTEM,
      model: gemini({ model: "gemini-2.5-pro", apiKey: env.GEMINI_API_KEY }),
      tools: [
        createTool({
          name: "terminal",
          description: "Run terminal commands.",
          parameters: z.object({ command: z.string() }),
          handler: async ({ command }, { step }: Tool.Options<AgentState>) => {
            return await step?.run("tool-terminal", async () => {
              await db.message.update({
                where: { id: initialMessageId },
                data: { content: `Executing: \`${command}\`` },
              });
              const sandbox = await getSandbox(sandboxId);
              try {
                const { stdout, stderr } = await sandbox.commands.run(command);
                if (stderr) return `Error: ${stderr}`;
                return stdout;
              } catch (e) {
                return `Execution Error: ${e instanceof Error ? e.message : String(e)}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files.",
          parameters: z.object({
            files: z.array(z.object({ path: z.string(), content: z.string() })),
          }),
          handler: async (
            { files },
            { network, step }: Tool.Options<AgentState>,
          ) => {
            return await step?.run("tool-write-files", async () => {
              const filePaths = files.map((f) => f.path).join(", ");
              await db.message.update({
                where: { id: initialMessageId },
                data: { content: `Writing files: ${filePaths}` },
              });

              const sandbox = await getSandbox(sandboxId);
              const updatedFiles = network.state.data.files || {};
              try {
                // OPTIMIZATION: Parallelize file writing with Promise.all.
                await Promise.all(
                  files.map(async (file) => {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }),
                );

                network.state.data.files = updatedFiles;
                await db.message.update({
                  where: { id: initialMessageId },
                  data: { fragments: { update: { files: updatedFiles } } },
                });
                return `Successfully wrote ${files.length} files.`;
              } catch (e) {
                return `Error writing files: ${e instanceof Error ? e.message : String(e)}`;
              }
            });
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files.",
          parameters: z.object({ files: z.array(z.string()) }),
          handler: async ({ files }, { step }: Tool.Options<AgentState>) => {
            return await step?.run("tool-read-files", async () => {
              await db.message.update({
                where: { id: initialMessageId },
                data: { content: `Reading files: ${files.join(", ")}` },
              });

              const sandbox = await getSandbox(sandboxId);
              try {
                // OPTIMIZATION: Parallelize file reading with Promise.all.
                const contents = await Promise.all(
                  files.map(async (file) => ({
                    path: file,
                    content: await sandbox.files.read(file),
                  })),
                );
                return JSON.stringify(contents);
              } catch (e) {
                return `Error reading files: ${e instanceof Error ? e.message : String(e)}`;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastText = lastAssistantTextMessageContent(result);
          if (lastText?.includes("<task_summary>") && network) {
            network.state.data.summary = lastText;
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: ({ network }) =>
        network.state.data.summary ? undefined : codeAgent,
    });

    const result = await network.run(event.data.value);

    if (!result.state.data.summary) {
      return await step.run("handle-failure", () =>
        db.message.update({
          where: { id: initialMessageId },
          data: {
            content: "Agent failed to complete the task.",
            type: "ERROR",
            status: "FAILED",
          },
        }),
      );
    }

    await step.run("generate-final-response", async () => {
      await db.message.update({
        where: { id: initialMessageId },
        data: { content: "Generating final response..." },
      });

      const generateTitleAgent = createAgent({
        name: "title-gen",
        system: PROMPT.FRAGMENT_TITLE_PROMPT,
        model: gemini({
          model: "gemini-2.5-flash",
          apiKey: env.GEMINI_API_KEY,
        }),
      });
      const generateContentAgent = createAgent({
        name: "content-gen",
        system: PROMPT.RESPONSE_PROMPT,
        model: gemini({
          model: "gemini-2.5-flash",
          apiKey: env.GEMINI_API_KEY,
        }),
      });

      const [titleResult, contentResult] = await Promise.all([
        generateTitleAgent.run(result.state.data.summary),
        generateContentAgent.run(result.state.data.summary),
      ]);

      const title =
        lastAssistantTextMessageContent(titleResult) ?? "Generated Code";
      const content =
        lastAssistantTextMessageContent(contentResult) ??
        "The agent has completed the task.";

      await db.user.update({
        where: { id: event.data.userId },
        data: { credits: { decrement: 1 } },
      });

      return db.message.update({
        where: { id: initialMessageId },
        data: {
          content,
          type: "RESULT",
          status: "COMPLETED",
          fragments: { update: { title } },
        },
      });
    });
  },
);

export const testAgent = inngest.createFunction(
  { id: "test-agent" },
  { event: "test/agent" },
  async ({ event }) => {
    const { value } = event.data;

    // const agent = mastra.getAgent("summarizing-user-request-agent");

    // const agentResponse = await agent.generate(value);

    // console.log(
    //   "===================================================================",
    // );
    // console.log("agentResponse: ", agentResponse.text);
    // console.log(
    //   "===================================================================",
    // );

    // const result = agentResponse.text;

    const workflow = mastra.getWorkflow("coding-workflow");
    const workflowRun = await workflow.createRunAsync();

    const workflowResult = workflowRun.stream({
      inputData: {
        input: value,
      },
    });
    console.log(
      "===================================================================",
    );
    console.log("workFlowResult", workflowResult);
    console.log(
      "===================================================================",
    );

    for await (const chunk of workflowResult.stream) {
      console.log(chunk);
    }

    const result = workflowResult.getWorkflowState();

    // const codingNetwork = mastra.vnext_getNetwork("coding-network");

    // const runtimeContext = new RuntimeContext();
    // const result = await codingNetwork?.generate(value, {
    //   runtimeContext,
    // });

    // console.log(
    //   "===================================================================",
    // );
    // console.log("result", result?.result);
    // console.log("result status", result?.status);
    // console.log("result steps", result?.steps);
    // console.log(
    //   "===================================================================",
    // );

    return result;
  },
);
