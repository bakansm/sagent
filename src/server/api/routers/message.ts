import z from "zod";

import { inngest } from "@/inngest/client";
import { db } from "@/libs/db.lib";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const messageRouter = createTRPCRouter({
  getMessages: publicProcedure
    .input(z.object({ threadId: z.string().min(1, "Thread ID is required") }))
    .query(async ({ input }) => {
      const messages = await db.message.findMany({
        orderBy: {
          updatedAt: "asc",
        },
        where: {
          threadId: input.threadId,
        },
        include: {
          fragments: true,
        },
      });

      return messages;
    }),

  sendMessage: publicProcedure
    .input(
      z.object({
        message: z
          .string()
          .min(1, "Message is required")
          .max(1000, "Message is too long"),
        threadId: z.string().min(1, "Thread ID is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const { message, threadId } = input;

      const newMessage = await db.message.create({
        data: {
          content: message,
          role: "USER",
          type: "RESULT",
          threadId,
        },
      });

      await inngest.send({
        name: "agent/call",
        data: { value: message, threadId },
      });

      return newMessage;
    }),
});
