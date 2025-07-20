import z from "zod";

import { inngest } from "@/inngest/client";
import { db } from "@/libs/db.lib";
import { refreshDailyCredits } from "@/libs/server-utils.lib";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { MessageStatus } from "@prisma/client";
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
        status: z.nativeEnum(MessageStatus).default("COMPLETED"),
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

      // Refresh daily credits if needed
      let user = await refreshDailyCredits(ctx.session?.userId);

      if (!user) {
        user = await db.user.create({
          data: {
            id: ctx.session?.userId,
          },
        });
      } else {
        if (user.credits <= 0) {
          return {
            success: false,
            error:
              "You don't have enough credits to send a message. Purchase more credits to continue.",
            credits: user.credits,
          };
        }
      }

      const newMessage = await db.message.create({
        data: {
          content: message,
          role: "USER",
          type: "RESULT",
          status: input.status,
          threadId,
          userId: ctx.session?.userId,
        },
      });

      await inngest.send({
        name: "agent/call",
        data: { value: message, threadId, userId: ctx.session?.userId },
      });

      return {
        success: true,
        message: newMessage,
      };
    }),
});
