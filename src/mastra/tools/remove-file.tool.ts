import { getSandbox } from "@/inngest/utils";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const removeFileTool = createTool({
  id: "remove-file",
  description: "Remove a file or directory.",
  inputSchema: z.object({
    paths: z.array(z.string()).describe("Path to a file or directory."),
    sandboxId: z.string().describe("The sandbox ID"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { paths, sandboxId } = context;
    const sandbox = await getSandbox(sandboxId);
    try {
      await Promise.all(paths.map((path) => sandbox.files.remove(path)));
      return {
        success: true,
        message: `Successfully removed ${paths.length} file or directory in sandbox ${sandboxId}.`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to remove ${paths.length} file or directory in sandbox ${sandboxId}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
