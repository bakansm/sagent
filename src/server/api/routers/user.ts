import { abi } from "@/contract/abi";
import { address } from "@/contract/address";
import { sagentChain } from "@/contract/chain";
import { env } from "@/env";
import { db } from "@/libs/db.lib";
import {
  getDailyCreditLimit,
  refreshDailyCredits,
} from "@/libs/server-utils.lib";
import { PlanType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const publicClient = createPublicClient({
  chain: sagentChain,
  transport: http(),
});

// Admin wallet client for withdrawals
const adminPrivateKey = env.ADMIN_PRIVATE_KEY.startsWith("0x")
  ? env.ADMIN_PRIVATE_KEY
  : `0x${env.ADMIN_PRIVATE_KEY}`;
const adminAccount = privateKeyToAccount(adminPrivateKey as Hex);
const walletClient = createWalletClient({
  account: adminAccount,
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
        subscriptionExpiresAt: user.subscriptionExpiresAt,
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

  // New subscription mutation with smart contract withdrawal
  subscribeToPlan: protectedProcedure
    .input(
      z.object({
        plan: z.nativeEnum(PlanType),
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Get plan costs
      const planCosts = {
        [PlanType.FREE]: 0,
        [PlanType.PRO]: 0.005, // 0.005 ETH
        [PlanType.PREMIUM]: 0.01, // 0.01 ETH
      };

      const planCost = planCosts[input.plan];

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

      // For paid plans, check wallet balance and withdraw payment
      try {
        // Check user's balance in smart contract
        const balance = await publicClient.readContract({
          address: address.sagent as Hex,
          abi: abi,
          functionName: "getBalance",
          account: input.walletAddress as Hex,
        });

        const balanceETH = parseFloat(formatEther(balance));

        if (balanceETH < planCost) {
          return {
            success: false,
            error: `Insufficient balance. You need ${planCost} ETH but only have ${balanceETH.toFixed(6)} ETH.`,
            requiredAmount: planCost,
            currentBalance: balanceETH,
          };
        }

        // Withdraw payment from contract to admin wallet
        const withdrawAmount = parseEther(planCost.toString());

        const { request } = await publicClient.simulateContract({
          address: address.sagent as Hex,
          abi: abi,
          functionName: "withdraw",
          args: [adminAccount.address, withdrawAmount],
          account: adminAccount,
        });

        const hash = await walletClient.writeContract(request);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          return {
            success: false,
            error: "Payment transaction failed. Please try again.",
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
          transactionHash: hash,
          costDeducted: planCost,
        };
      } catch (error) {
        console.error("Failed to process subscription payment:", error);
        return {
          success: false,
          error: "Failed to process payment. Please try again.",
        };
      }
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
