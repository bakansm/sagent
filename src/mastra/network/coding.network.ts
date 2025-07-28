import { PROMPT } from "@/constants/prompt.constant";
import { google } from "@ai-sdk/google";
import { NewAgentNetwork } from "@mastra/core/network/vNext";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { codingAgent } from "../agents/coding.agent";
import { summarizingUserRequestAgent } from "../agents/sumarize-user-request.agent";
import { listFilesTool } from "../tools/list-files.tool";
import { makeDirTool } from "../tools/make-dir.tool";
import { readFileTool } from "../tools/read-file.tool";
import { removeFileTool } from "../tools/remove-file.tool";
import { renameFileTool } from "../tools/rename-file.tool";
import { terminalTool } from "../tools/terminal.tool";
import { writeFileTool } from "../tools/write-file.tool";
import { codingWorkflow } from "../workflows/coding.workflow";

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db",
  }),
});

export const codingNetwork = new NewAgentNetwork({
  id: "coding-network",
  name: "Coding Network",
  instructions: PROMPT.SYSTEM,
  model: google("gemini-2.5-flash"),
  agents: {
    codingAgent,
    summarizingUserRequestAgent,
  },
  workflows: {
    codingWorkflow,
  },
  tools: {
    terminalTool,
    listFilesTool,
    writeFileTool,
    makeDirTool,
    removeFileTool,
    renameFileTool,
    readFileTool,
  },
  memory,
});
