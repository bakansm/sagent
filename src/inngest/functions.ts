/* eslint-disable */
import { PROMPT } from "@/constants/prompt.constant";
import { env } from "@/env";
import { Sandbox } from "@e2b/code-interpreter";
import {
  createAgent,
  createNetwork,
  createTool,
  gemini,
  type Tool,
} from "@inngest/agent-kit";

import { db } from "@/libs/db.lib";
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
    const initialMessage = await step.run("setup-environment", async () => {
      const createdMessage = await db.message.create({
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
      return createdMessage;
    });
    const initialMessageId = initialMessage.id;

    const sandboxId = await step.run("create-sandbox", async () => {
      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Creating sandbox...",
        },
      });

      const { sandboxId } = await Sandbox.create("sagent-nextjs", {
        timeoutMs: 1000 * 60 * 60,
        apiKey: env.E2B_API_KEY,
      });

      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Sandbox created. Connecting to sandbox...",
          fragments: { update: { sandboxId } },
        },
      });
      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Connecting to sandbox...",
        },
      });

      const sandbox = await getSandbox(sandboxId);
      const host = sandbox?.getHost(3000);

      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Sandbox connected. Starting agent...",
          fragments: { update: { sandboxUrl: `https://${host ?? ""}` } },
        },
      });

      return sandboxId;
    });

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT.SYSTEM,

      model: gemini({
        model: "gemini-2.5-pro",
        apiKey: env.GEMINI_API_KEY,
        // defaultParameters: {
        //   generationConfig: {
        //     temperature: 0.3,
        //   },
        // },
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

                const messageContent = `Executing terminal command: \`${command}\``;

                await db.message.update({
                  where: { id: initialMessageId },
                  data: {
                    content: messageContent,
                    type: "TEXT",
                  },
                });

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

                const messageContent = `Command \`${command}\` failed.`;
                await db.message.update({
                  where: { id: initialMessageId },
                  data: {
                    content: messageContent,
                    type: "ERROR",
                  },
                });

                return messageContent;
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

                  // Update the message content and fragments with the updated files
                  await db.message.update({
                    where: { id: initialMessageId },
                    data: {
                      content: `Creating and updating files`,
                      fragments: {
                        update: {
                          files: updatedFiles,
                        },
                      },
                    },
                  });

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

                // Update the message content with the read files
                await db.message.update({
                  where: { id: initialMessageId },
                  data: {
                    content: `Reading files`,
                  },
                });

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
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    const generateTitleAgent = createAgent<AgentState>({
      name: "fragment-title-generator",
      description: "A fragment title generator",
      system: PROMPT.FRAGMENT_TITLE_PROMPT,
      model: gemini({
        model: "gemini-2.5-flash",
        apiKey: env.GEMINI_API_KEY,
      }),
    });

    const generateContentAgent = createAgent<AgentState>({
      name: "response-generator",
      description: "A response generator",
      system: PROMPT.RESPONSE_PROMPT,
      model: gemini({
        model: "gemini-2.5-flash",
        apiKey: env.GEMINI_API_KEY,
      }),
    });

    const { output: generatedTitle } = await generateTitleAgent.run(
      result.state.data.summary,
    );

    const { output: generatedContent } = await generateContentAgent.run(
      result.state.data.summary,
    );

    await step.run("generate-fragment-title", async () => {
      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Generating fragment title...",
        },
      });

      let title = "New Thread";

      if (generatedTitle[0]?.type !== "text") {
        title = "New Thread";
      } else {
        if (Array.isArray(generatedTitle[0].content)) {
          title = generatedTitle[0].content.map((c) => c).join("");
        } else {
          title = generatedTitle[0].content;
        }
      }

      await db.message.update({
        where: { id: initialMessageId },
        data: {
          fragments: { update: { title } },
        },
      });
    });

    await step.run("generate-response", async () => {
      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content: "Generating response...",
        },
      });

      let content;

      if (generatedContent[0]?.type !== "text") {
        content = "Something went wrong. Please try again.";
      } else {
        if (Array.isArray(generatedContent[0].content)) {
          content = generatedContent[0].content.map((c) => c).join("");
        } else {
          content = generatedContent[0].content;
        }
      }

      await db.message.update({
        where: { id: initialMessageId },
        data: {
          content,
        },
      });
    });

    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files ?? {}).length === 0;

    await step.run("update-final-message", async () => {
      if (isError) {
        return await db.message.update({
          where: { id: initialMessageId },
          data: {
            type: "ERROR",
            status: "FAILED",
            fragments: {
              update: {
                files: {},
              },
            },
          },
        });
      }

      await db.user.update({
        where: { id: event.data.userId },
        data: { credits: { decrement: 1 } },
      });

      return await db.message.update({
        where: { id: initialMessageId },
        data: {
          type: "RESULT",
          status: "COMPLETED",
        },
      });
    });
  },
);
