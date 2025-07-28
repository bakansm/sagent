import { PROMPT } from "@/constants/prompt.constant";
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { listFilesTool } from "../tools/list-files.tool";
import { makeDirTool } from "../tools/make-dir.tool";
import { readFileTool } from "../tools/read-file.tool";
import { removeFileTool } from "../tools/remove-file.tool";
import { renameFileTool } from "../tools/rename-file.tool";
import { terminalTool } from "../tools/terminal.tool";
import { writeFileTool } from "../tools/write-file.tool";

export const codingAgent = new Agent({
  name: "Coding Agent",
  instructions: PROMPT.SYSTEM,
  description: "A coding agent that can write code and run it in a sandbox.",
  model: google("gemini-2.5-pro"),
  tools: {
    terminalTool,
    listFilesTool,
    writeFileTool,
    makeDirTool,
    removeFileTool,
    renameFileTool,
    readFileTool,
  },
});
