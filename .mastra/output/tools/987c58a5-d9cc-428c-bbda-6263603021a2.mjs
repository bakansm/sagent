import { g as getSandbox } from '../utils.mjs';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import '@t3-oss/env-nextjs';
import '@e2b/code-interpreter';

const listFilesTool = createTool({
  id: "list-files",
  description: "List of entries in the sandbox filesystem directory.",
  inputSchema: z.object({
    path: z.string().describe("The path to the directory."),
    sandboxId: z.string().describe("The sandbox ID")
  }),
  outputSchema: z.object({
    entryPath: z.string().describe("The path to the directory."),
    entries: z.array(
      z.object({
        name: z.string().describe("The name of the entry."),
        type: z.enum(["file", "dir"]).optional().describe("The type of the entry."),
        path: z.string().describe("The path to the entry.")
      })
    ).describe("The list of entries in the directory")
  }),
  execute: async ({
    context
  }) => {
    const { path, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    const entries = await sandbox.files.list(path);
    return {
      entryPath: path,
      entries: entries.map((entry) => ({
        name: entry.name,
        type: entry.type,
        path: entry.path
      }))
    };
  }
});

export { listFilesTool };
//# sourceMappingURL=987c58a5-d9cc-428c-bbda-6263603021a2.mjs.map
