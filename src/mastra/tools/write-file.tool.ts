import { getSandbox } from "@/inngest/utils";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const writeFileTool = createTool({
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
        data: z.string().describe("Content to write to the file."),
      }),
    ),
    sandboxId: z.string().describe("The sandbox ID"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { files, sandboxId } = context;

    const sandbox = await getSandbox(sandboxId);
    try {
      await Promise.all(
        files.map((file) => sandbox.files.write(file.path, file.data)),
      );

      return {
        success: true,
        message: `Successfully wrote ${files.length} file(s) to sandbox ${sandboxId}.`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to write file(s) to sandbox ${sandboxId}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
