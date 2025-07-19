import z from "zod";

import { inngest } from "@/inngest/client";
import { db } from "@/libs/db.lib";
import { refreshDailyCredits } from "@/libs/server-utils.lib";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const threadRouter = createTRPCRouter({
  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().min(1, "Thread ID is required") }))
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const thread = await db.thread.findUnique({
        where: { id: input.threadId },
        include: {
          messages: {
            where: {
              userId: ctx.session?.userId,
            },
          },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      return thread;
    }),

  getThreads: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const threads = await db.thread.findMany({
      orderBy: {
        updatedAt: "asc",
      },
      include: {
        messages: {
          where: {
            userId: ctx.session?.userId,
          },
        },
      },
    });

    return threads;
  }),

  createThread: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, "Value is required")
          .max(1000, "Value is too long"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { value } = input;

      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Refresh daily credits if needed
      let user = await refreshDailyCredits(ctx.session?.userId);

      // Create new user with initial credits if not found
      user ??= await db.user.create({
        data: {
          id: ctx.session?.userId,
        },
      });

      // Check if user has credits
      if (user.credits <= 0) {
        return {
          success: false,
          error:
            "You don't have enough credits to start a new conversation. Purchase more credits to continue.",
          credits: user.credits,
        };
      }

      const createdThread = await db.thread.create({
        data: {
          name: "New Thread",
          userId: ctx.session?.userId,
          messages: {
            create: {
              content: value,
              role: "USER",
              type: "RESULT",
              userId: ctx.session?.userId,
            },
          },
        },
      });

      // Update user credits minus 1
      await db.user.update({
        where: {
          id: ctx.session?.userId,
        },
        data: { credits: user.credits - 1 },
      });

      await inngest.send([
        {
          name: "agent/call",
          threadId: createdThread.id,
          data: {
            value: value,
            threadId: createdThread.id,
            userId: ctx.session?.userId,
          },
        },
      ]);

      return {
        success: true,
        thread: createdThread,
        credits: user.credits - 1,
      };
    }),
});
