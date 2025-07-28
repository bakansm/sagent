import { g as getSandbox } from '../utils.mjs';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import '@t3-oss/env-nextjs';
import '@e2b/code-interpreter';

const readFileTool = createTool({
  id: "read-file",
  description: `
  - Read file content as a string.
  - You can pass text, bytes, blob, or stream to opts.format to change the return type.
`,
  inputSchema: z.object({
    paths: z.array(z.string()).describe("Path to a file."),
    sandboxId: z.string().describe("The sandbox ID")
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        path: z.string().describe("Path to a file."),
        content: z.string().describe("The content of the file.")
      })
    )
  }),
  execute: async ({ context }) => {
    const { paths, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    try {
      const files = await Promise.all(
        paths.map(async (path) => ({
          path,
          content: await sandbox.files.read(path)
        }))
      );
      return {
        files
      };
    } catch (error) {
      return {
        files: []
      };
    }
  }
});

export { readFileTool };
//# sourceMappingURL=62c26169-36ed-4931-811e-5b5f1bb69e44.mjs.map
