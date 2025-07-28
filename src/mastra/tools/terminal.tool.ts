import { getSandbox } from "@/inngest/utils";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const terminalTool = createTool({
  id: "terminal",
  description: "Start a new command and wait until it finishes executing.",
  inputSchema: z.object({
    command: z.string().describe("The command to run"),
    sandboxId: z.string().describe("The sandbox ID"),
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
  }),
  execute: async ({ context }) => {
    const { command, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    try {
      const { stdout, stderr } = await sandbox.commands.run(command);
      if (stderr) throw new Error(stderr);
      return { stdout, stderr };
    } catch (e) {
      throw new Error(
        `Execution Error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  },
});
