import { abi } from "@/contract/abi";
import { address } from "@/contract/address";
import { sagentChain } from "@/contract/chain";
import { db } from "@/libs/db.lib";
import {
  getDailyCreditLimit,
  refreshDailyCredits,
} from "@/libs/server-utils.lib";
import { PlanType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createPublicClient, formatEther, http, type Hex } from "viem";
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

    // Refresh daily credits if needed
    const refreshedUser = await refreshDailyCredits(ctx.session?.userId);

    return {
      ...refreshedUser,
      isNewUser,
    };
  }),

  getBillingInfo: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Refresh daily credits first
      const user = await refreshDailyCredits(ctx.session?.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Fetch balance from user's wallet (ETH balance)
      let contractBalance = "0";
      try {
        const balance = await publicClient.readContract({
          address: address.sagent as Hex,
          abi: abi,
          functionName: "getBalance",
          account: input.walletAddress as Hex,
        });

        contractBalance = formatEther(balance);
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        contractBalance = "0";
      }

      const dailyLimit = getDailyCreditLimit(user.plan);

      return {
        balance: contractBalance, // Balance from smart contract
        plan: user.plan,
        credits: user.credits,
        creditsUsedToday: user.creditsUsedToday,
        dailyLimit,
        planDisplayName:
          user.plan === PlanType.FREE
            ? "Free (5 credits/day)"
            : user.plan === PlanType.PRO
              ? "Pro (30 credits/day)"
              : "Premium (60 credits/day)",
      };
    }),

  depositBalance: protectedProcedure
    .input(
      z.object({
        amount: z.string().refine((val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        }, "Amount must be a positive number"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const user = await db.user.findUnique({
        where: { id: ctx.session.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Since balance is now from smart contract, we just return success
      // The actual balance will be read from the contract on next query
      return {
        newBalance: "Updated on blockchain",
        depositAmount: input.amount,
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
