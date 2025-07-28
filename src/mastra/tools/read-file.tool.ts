import { getSandbox } from "@/inngest/utils";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const readFileTool = createTool({
  id: "read-file",
  description: `
  - Read file content as a string.
  - You can pass text, bytes, blob, or stream to opts.format to change the return type.
`,
  inputSchema: z.object({
    paths: z.array(z.string()).describe("Path to a file."),
    sandboxId: z.string().describe("The sandbox ID"),
  }),
  outputSchema: z.object({
    files: z.array(
      z.object({
        path: z.string().describe("Path to a file."),
        content: z.string().describe("The content of the file."),
      }),
    ),
  }),
  execute: async ({ context }) => {
    const { paths, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    try {
      const files = await Promise.all(
        paths.map(async (path) => ({
          path,
          content: await sandbox.files.read(path),
        })),
      );
      return {
        files,
      };
    } catch (error: unknown) {
      console.error("Error reading file: ", error);
      return {
        files: [],
      };
    }
  },
});
