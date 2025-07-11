/* eslint-disable */
import { PROMPT } from "@/constants/prompt.constant";
import { env } from "@/env";
import { Sandbox } from "@e2b/code-interpreter";
import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  gemini,
  type Tool,
} from "@inngest/agent-kit";

import { db } from "@/libs/db.lib";
import type { Message } from "@prisma/client";
import z from "zod";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

interface AgentState {
  summary: string;
  files: Record<string, string>;
}

export const callAgent = inngest.createFunction(
  { id: "call-agent" },
  { event: "agent/call" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("sagent-nextjs", {
        timeoutMs: 1000 * 60 * 60,
      });
      return sandbox.sandboxId;
    });

    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages: Message[] = [];
        const messages: Message[] = await db.message.findMany({
          where: {
            threadId: event.data.threadId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        for (const message of messages) {
          formattedMessages.push({
            id: message.id,
            type: message.type,
            content: message.content,
            role: message.role,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            threadId: message.threadId,
            userId: message.userId,
          });
        }

        return formattedMessages;
      },
    );

    const state = createState<AgentState>({
      summary: previousMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n"),
      files: {},
    });

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT.SYSTEM,

      model: gemini({
        model: "gemini-2.5-pro",
        apiKey: env.GEMINI_API_KEY,
        defaultParameters: {
          generationConfig: {
            temperature: 0.1,
          },
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Run terminal commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }: Tool.Options<AgentState>) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.error(
                  `Command failed: ${errorMessage} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
                );
                return `Command failed: ${errorMessage} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async (
            { files },
            { network, step }: Tool.Options<AgentState>,
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  const errorMessage =
                    error instanceof Error ? error.message : String(error);
                  return "Error: " + errorMessage;
                }
              },
            );

            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }

            return newFiles;
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }: Tool.Options<AgentState>) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({
                    path: file,
                    content,
                  });
                }
                return JSON.stringify(contents);
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                return "Error: " + errorMessage;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }

          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value, {
      state,
    });

    const fragmentTitleGenerator = createAgent<AgentState>({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: PROMPT.FRAGMENT_TITLE_PROMPT,
      model: gemini({
        model: "gemini-2.5-flash",
        apiKey: env.GEMINI_API_KEY,
      }),
    });

    const responseGenerator = createAgent<AgentState>({
      name: "response-generator",
      description: "A response generator",
      system: PROMPT.RESPONSE_PROMPT,
      model: gemini({
        model: "gemini-2.5-flash",
        apiKey: env.GEMINI_API_KEY,
      }),
    });

    const { output: fragmentTitle } = await fragmentTitleGenerator.run(
      result.state.data.summary,
    );

    const { output: response } = await responseGenerator.run(
      result.state.data.summary,
    );

    const generateTitle = () => {
      if (fragmentTitle[0]?.type !== "text") {
        return "New Thread";
      }
      if (Array.isArray(fragmentTitle[0].content)) {
        return fragmentTitle[0].content.map((c) => c).join("");
      } else {
        return fragmentTitle[0].content;
      }
    };

    const generateResponse = () => {
      if (response[0]?.type !== "text") {
        return "Something went wrong. Please try again.";
      }
      if (Array.isArray(response[0].content)) {
        return response[0].content.map((c) => c).join("");
      } else {
        return response[0].content;
      }
    };

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files ?? {}).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("create-message", async () => {
      if (isError) {
        return await db.message.create({
          data: {
            content: generateResponse(),
            role: "ASSISTANT",
            type: "ERROR",
            threadId: event.data.threadId,
            userId: event.data.userId,
          },
        });
      }

      return await db.message.create({
        data: {
          content: generateResponse(),
          threadId: event.data.threadId,
          role: "ASSISTANT",
          type: "RESULT",
          userId: event.data.userId,
          fragments: {
            create: {
              sandboxId,
              sandboxUrl,
              title: generateTitle(),
              files: result.state.data.files,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      sandboxId,
      title: generateTitle(),
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
