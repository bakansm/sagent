import { getSandbox } from "@/inngest/utils";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const makeDirTool = createTool({
  id: "make-dir",
  description:
    "Create a new directory and all directories along the way if needed on the specified path.",
  inputSchema: z.object({
    paths: z.array(z.string()).describe("The path to make"),
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
      await Promise.all(paths.map((path) => sandbox.files.makeDir(path)));
      return {
        success: true,
        message: `Successfully made directories ${paths.join(", ")} in sandbox ${sandboxId}.`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: `Failed to make directories ${paths.join(", ")} in sandbox ${sandboxId}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
