import z from "zod";

import { inngest } from "@/inngest/client";
import { db } from "@/libs/db.lib";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const messageRouter = createTRPCRouter({
  getMessages: protectedProcedure
    .input(z.object({ threadId: z.string().min(1, "Thread ID is required") }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      const messages = await db.message.findMany({
        orderBy: {
          updatedAt: "asc",
        },
        where: {
          threadId: input.threadId,
          userId: ctx.session?.userId,
        },
        include: {
          fragments: true,
        },
      });

      return messages;
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z
          .string()
          .min(1, "Message is required")
          .max(1000, "Message is too long"),
        threadId: z.string().min(1, "Thread ID is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { message, threadId } = input;

      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const user = await db.user.findUnique({
        where: {
          id: ctx.session?.userId,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.credits <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User has no credits",
        });
      }

      const newMessage = await db.message.create({
        data: {
          content: message,
          role: "USER",
          type: "RESULT",
          threadId,
          userId: ctx.session?.userId,
        },
      });

      await db.user.update({
        select: {
          credits: true,
        },
        where: {
          id: ctx.session?.userId,
        },
        data: { credits: user.credits - 1 },
      });

      await inngest.send({
        name: "agent/call",
        data: { value: message, threadId, userId: ctx.session?.userId },
      });

      return newMessage;
    }),
});
