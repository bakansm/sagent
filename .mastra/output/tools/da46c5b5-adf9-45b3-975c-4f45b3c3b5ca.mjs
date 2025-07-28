import { g as getSandbox } from '../utils.mjs';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import '@t3-oss/env-nextjs';
import '@e2b/code-interpreter';

const writeFileTool = createTool({
  id: "write-file",
  description: `
  - Write content to a file.
  - Writing to a file that doesn't exist creates the file.
  - Writing to a file that already exists overwrites the file.
  - Writing to a file at path that doesn't exist creates the necessary directories.
  `,
  inputSchema: z.object({
    files: z.array(
      z.object({
        path: z.string().describe("Path to a file."),
        data: z.string().describe("Content to write to the file.")
      })
    ),
    sandboxId: z.string().describe("The sandbox ID")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string()
  }),
  execute: async ({ context }) => {
    const { files, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    try {
      await Promise.all(
        files.map((file) => sandbox.files.write(file.path, file.data))
      );
      return {
        success: true,
        message: `Successfully wrote ${files.length} file(s) to sandbox ${sandboxId}.`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to write file(s) to sandbox ${sandboxId}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
});

export { writeFileTool };
//# sourceMappingURL=da46c5b5-adf9-45b3-975c-4f45b3c3b5ca.mjs.map
