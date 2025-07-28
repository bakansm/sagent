import { g as getSandbox } from '../utils.mjs';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import '@t3-oss/env-nextjs';
import '@e2b/code-interpreter';

const renameFileTool = createTool({
  id: "rename-file",
  description: "Rename a file or directory.",
  inputSchema: z.object({
    paths: z.array(
      z.object({
        oldPath: z.string().describe("The path to rename"),
        newPath: z.string().describe("The new path")
      })
    ),
    sandboxId: z.string().describe("The sandbox ID")
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        name: z.string().describe("The name of the file or directory."),
        type: z.enum(["file", "dir"]).describe("The type of the file or directory."),
        path: z.string().describe("The path to the file or directory.")
      })
    )
  }),
  execute: async ({ context }) => {
    const { paths, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    try {
      const files = await Promise.all(
        paths.map((path) => sandbox.files.rename(path.oldPath, path.newPath))
      );
      const resultFiles = files.filter((file) => file && (file.type === "file" || file.type === "dir")).map((file) => ({
        name: file.name,
        type: file.type,
        path: file.path
      }));
      return {
        files: resultFiles
      };
    } catch (error) {
      return {
        files: []
      };
    }
  }
});

export { renameFileTool };
//# sourceMappingURL=6fb39c75-3c4b-4c37-b710-a31d19a5b2ff.mjs.map
