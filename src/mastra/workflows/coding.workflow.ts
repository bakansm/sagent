import { env } from "@/env";
import Sandbox from "@e2b/code-interpreter";
import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { summarizingUserRequestAgent } from "../agents/sumarize-user-request.agent";

const setupEnvironment = createStep({
  id: "setup-environment",
  description: "Sets up the environment for the coding agent",
  inputSchema: z.object({
    input: z.string().describe("The user request"),
  }),
  outputSchema: z.object({
    sandboxId: z.string().describe("The sandbox ID"),
    sandboxUrl: z.string().describe("The sandbox URL"),
    summarizedRequest: z.string().describe("The summary of the user request"),
  }),
  execute: async ({ inputData }) => {
    const { input } = inputData;
    const summarizedInputRequest =
      await summarizingUserRequestAgent.generate(input);

    const sandbox = await Sandbox.create("sagent-nextjs", {
      timeoutMs: 1000 * 60 * 60, // 1 hour
      apiKey: env.E2B_API_KEY,
    });

    const host = sandbox.getHost(3000);

    const sandboxId = sandbox.sandboxId;
    const sandboxUrl = `https://${host ?? ""}`;

    return {
      sandboxId,
      sandboxUrl,
      summarizedRequest: summarizedInputRequest.text,
    };
  },
});

export const codingWorkflow = createWorkflow({
  id: "coding-workflow",
  inputSchema: z.object({
    input: z.string().describe("The user request"),
  }),
  outputSchema: z.object({
    sandboxId: z.string().describe("The sandbox ID"),
    sandboxUrl: z.string().describe("The sandbox URL"),
    summary: z.string().describe("The summary of the user request"),
  }),
  steps: [],
})
  .then(setupEnvironment)
  .commit();
