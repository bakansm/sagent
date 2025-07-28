import { g as getSandbox } from '../utils.mjs';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import '@t3-oss/env-nextjs';
import '@e2b/code-interpreter';

const terminalTool = createTool({
  id: "terminal",
  description: "Start a new command and wait until it finishes executing.",
  inputSchema: z.object({
    command: z.string().describe("The command to run"),
    sandboxId: z.string().describe("The sandbox ID")
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string()
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
        `Execution Error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
});

export { terminalTool };
//# sourceMappingURL=285ceabe-b5b0-4903-a775-6a0ff3883fd1.mjs.map
