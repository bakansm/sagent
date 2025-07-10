import z from "zod";

import { inngest } from "@/inngest/client";
import { db } from "@/libs/db.lib";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const threadRouter = createTRPCRouter({
  getThread: publicProcedure
    .input(z.object({ threadId: z.string().min(1, "Thread ID is required") }))
    .query(async ({ input }) => {
      const thread = await db.thread.findUnique({
        where: { id: input.threadId },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      return thread;
    }),

  getThreads: publicProcedure.query(async () => {
    const threads = await db.thread.findMany({
      orderBy: {
        updatedAt: "asc",
      },
      include: {
        messages: true,
      },
    });

    return threads;
  }),

  createThread: publicProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, "Value is required")
          .max(1000, "Value is too long"),
      }),
    )
    .mutation(async ({ input }) => {
      const { value } = input;

      const createdThread = await db.thread.create({
        data: {
          name: "New Thread",
          messages: {
            create: {
              content: value,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });

      await inngest.send([
        {
          name: "agent/call",
          threadId: createdThread.id,
          data: {
            value: value,
            threadId: createdThread.id,
          },
        },
      ]);

      return createdThread;
    }),
});
