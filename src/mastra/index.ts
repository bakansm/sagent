import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { codingAgent } from "./agents/coding.agent";
import { summarizingUserRequestAgent } from "./agents/sumarize-user-request.agent";
import { codingNetwork } from "./network/coding.network";
import { codingWorkflow } from "./workflows/coding.workflow";

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  workflows: {
    "coding-workflow": codingWorkflow,
  },
  agents: {
    "coding-agent": codingAgent,
    "summarizing-user-request-agent": summarizingUserRequestAgent,
  },
  vnext_networks: {
    "coding-network": codingNetwork,
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
