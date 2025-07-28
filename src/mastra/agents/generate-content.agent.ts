import { PROMPT } from "@/constants/prompt.constant";
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

export const generateContentAgent = new Agent({
  name: "Generate Content Agent",
  instructions: PROMPT.RESPONSE_PROMPT,
  model: google("gemini-2.5-flash"),
});
