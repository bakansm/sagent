import { realtimeMiddleware } from "@inngest/realtime";
import { Inngest } from "inngest";

// Create a client to send and receive events
// export const inngest = new Inngest({ id: "sagent" });

export const inngest = new Inngest({
  id: "sagent",
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://api.inngest.com"
      : "http://127.0.0.1:8288",
  isDev: process.env.NODE_ENV === "development",
  middleware: [realtimeMiddleware()],
});
