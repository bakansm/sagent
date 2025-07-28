import { PROMPT } from "@/constants/prompt.constant";
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

export const summarizingUserRequestAgent = new Agent({
  name: "Summarizing User Request Agent",
  instructions: PROMPT.SUMMARIZING_USER_REQUEST,
  model: google("gemini-2.5-pro", { useSearchGrounding: true }),
});
