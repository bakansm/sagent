import { sagentChain } from "@/configs/chain";
import { ADDRESS } from "@/constants/address";
import { db } from "@/libs/db.lib";
import {
  getDailyCreditLimit,
  refreshDailyCredits,
} from "@/libs/server-utils.lib";
import { PlanType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createPublicClient, http, type Hex } from "viem";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const publicClient = createPublicClient({
  chain: sagentChain,
  transport: http(),
});

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    let user = await db.user.findUnique({
      where: {
        id: ctx.session?.userId,
      },
    });

    let isNewUser = false;

    if (!user) {
      user = await db.user.create({
        data: {
          id: ctx.session?.userId,
        },
      });
      isNewUser = true;
    }

    // Check if subscription expired and downgrade if needed
    if (
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt <= new Date()
    ) {
      user = await db.user.update({
        where: { id: ctx.session?.userId },
        data: {
          plan: PlanType.FREE,
          credits: 5,
          subscriptionExpiresAt: null,
          creditsUsedToday: 0,
          lastCreditRefresh: new Date(),
        },
      });
    }

    // Refresh daily credits if needed
    const refreshedUser = await refreshDailyCredits(ctx.session?.userId);

    return {
      ...refreshedUser,
      isNewUser,
    };
  }),

  getBillingInfo: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    // Refresh daily credits first and check expiration
    let user = await refreshDailyCredits(ctx.session?.userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if subscription expired and downgrade if needed
    if (
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt <= new Date()
    ) {
      user = await db.user.update({
        where: { id: ctx.session?.userId },
        data: {
          plan: PlanType.FREE,
          credits: 5,
          subscriptionExpiresAt: null,
          creditsUsedToday: 0,
          lastCreditRefresh: new Date(),
        },
      });
    }

    const dailyLimit = getDailyCreditLimit(user.plan);

    return {
      plan: user.plan,
      credits: user.credits,
      creditsUsedToday: user.creditsUsedToday,
      dailyLimit,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      planDisplayName:
        user.plan === PlanType.FREE
          ? "Free (5 credits/day)"
          : user.plan === PlanType.PRO
            ? "Pro (30 credits/day)"
            : "Premium (60 credits/day)",
    };
  }),

  // New subscription mutation with direct contract calls
  subscribeToPlan: protectedProcedure
    .input(
      z.object({
        plan: z.nativeEnum(PlanType),
        transactionHash: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // For free plan, no payment required
      if (input.plan === PlanType.FREE) {
        const dailyCredits = getDailyCreditLimit(input.plan);

        const updatedUser = await db.user.update({
          where: { id: ctx.session.userId },
          data: {
            plan: input.plan,
            credits: dailyCredits,
            creditsUsedToday: 0,
            lastCreditRefresh: new Date(),
            subscriptionExpiresAt: null, // Free plan doesn't expire
          },
        });

        return {
          success: true,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          dailyLimit: dailyCredits,
          message: "Successfully switched to Free plan",
        };
      }

      // For paid plans, verify transaction hash if provided
      if (input.transactionHash) {
        try {
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: input.transactionHash as Hex,
          });

          if (receipt.status !== "success") {
            return {
              success: false,
              error: "Transaction failed. Please try again.",
            };
          }

          // Verify the transaction was to our contract
          if (
            receipt.to?.toLowerCase() !==
            ADDRESS.SUBSCRIPTION_MANAGER.toLowerCase()
          ) {
            return {
              success: false,
              error:
                "Invalid transaction. Please use the subscription buttons.",
            };
          }

          // Payment successful, update user's plan and set expiration (30 days)
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);

          const dailyCredits = getDailyCreditLimit(input.plan);

          const updatedUser = await db.user.update({
            where: { id: ctx.session.userId },
            data: {
              plan: input.plan,
              credits: dailyCredits,
              creditsUsedToday: 0,
              lastCreditRefresh: new Date(),
              subscriptionExpiresAt: expirationDate,
            },
          });

          return {
            success: true,
            plan: updatedUser.plan,
            credits: updatedUser.credits,
            dailyLimit: dailyCredits,
            subscriptionExpiresAt: updatedUser.subscriptionExpiresAt,
            message: `Successfully upgraded to ${input.plan} plan! Subscription valid for 30 days.`,
            transactionHash: input.transactionHash,
          };
        } catch (error) {
          console.error("Failed to verify transaction:", error);
          return {
            success: false,
            error: "Failed to verify transaction. Please try again.",
          };
        }
      }

      // If no transaction hash provided for paid plan, return instructions
      return {
        success: false,
        error: "Please complete the payment transaction first.",
        needsPayment: true,
      };
    }),

  updatePlan: protectedProcedure
    .input(
      z.object({
        plan: z.nativeEnum(PlanType),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Update user's plan and refresh credits based on new plan
      const dailyCredits = getDailyCreditLimit(input.plan);

      const updatedUser = await db.user.update({
        where: { id: ctx.session.userId },
        data: {
          plan: input.plan,
          credits: dailyCredits,
          creditsUsedToday: 0,
          lastCreditRefresh: new Date(),
        },
      });

      return {
        plan: updatedUser.plan,
        credits: updatedUser.credits,
        dailyLimit: dailyCredits,
      };
    }),

  createUser: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }
    const user = await db.user.create({
      data: {
        id: ctx.session?.userId,
      },
    });

    return user;
  }),
});
