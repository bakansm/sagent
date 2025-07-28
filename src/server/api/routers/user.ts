import { liskSepolia, sagentTestnet } from "@/configs/chain";
import { ABI } from "@/constants/abi.constant";
import { ADDRESS } from "@/constants/address.constant";
import { db } from "@/libs/db.lib";
import {
  getDailyCreditLimit,
  refreshDailyCredits,
} from "@/libs/server-utils.lib";
import { PlanType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createPublicClient, http, type Chain, type Hex } from "viem";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Helper function to get chain configuration by chainId
const getChainById = (chainId: number): Chain => {
  switch (chainId) {
    case sagentTestnet.id:
      return sagentTestnet;
    case liskSepolia.id:
      return liskSepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

// Helper function to get contract address by chainId
const getContractAddress = (chainId: number): string => {
  switch (chainId) {
    case sagentTestnet.id:
      return ADDRESS.SAGENT_CHAIN.SUBSCRIPTION_MANAGER;
    case liskSepolia.id:
      return ADDRESS.LISK_SEPOLIA.SUBSCRIPTION_MANAGER;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

// Helper function to convert contract tier to PlanType
const contractTierToPlanType = (tier: number): PlanType => {
  switch (tier) {
    case 0: // FREE
      return PlanType.FREE;
    case 1: // PRO
      return PlanType.PRO;
    case 2: // PREMIUM
      return PlanType.PREMIUM;
    default:
      return PlanType.FREE;
  }
};

// Helper function to check if subscription is expired
const isSubscriptionExpired = (endTime: bigint): boolean => {
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  return currentTime >= endTime;
};

// Function to sync contract subscription status with database
async function syncContractStatusToDatabase(
  userId: string,
  walletAddress: string,
  chainId: number,
) {
  try {
    const chain = getChainById(chainId);
    const contractAddress = getContractAddress(chainId);

    // Create public client for the specific chain
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Read subscription status from contract
    const contractData = (await publicClient.readContract({
      address: contractAddress as Hex,
      abi: ABI.SUBSCRIPTION_MANAGER,
      functionName: "getMySubscriptionStatus",
      account: walletAddress as Hex,
    })) as [number, bigint, bigint];

    const [contractTier, contractEndTime, contractDailyCredits] = contractData;

    // Determine current plan from contract
    const currentPlanFromContract = contractTierToPlanType(
      Number(contractTier),
    );

    // Check if subscription is expired
    const isExpired = contractEndTime
      ? isSubscriptionExpired(contractEndTime)
      : true;

    // Final current plan (FREE if expired, otherwise contract plan)
    const currentPlan = isExpired ? PlanType.FREE : currentPlanFromContract;

    // Calculate expiration date
    const subscriptionExpiresAt =
      contractEndTime && !isExpired
        ? new Date(Number(contractEndTime) * 1000)
        : null;

    // Get daily credits based on current active plan
    const dailyCredits = getDailyCreditLimit(currentPlan);

    // Update database with contract data
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        plan: currentPlan,
        credits: dailyCredits,
        creditsUsedToday: 0,
        lastCreditRefresh: new Date(),
        subscriptionExpiresAt: subscriptionExpiresAt,
      },
    });

    return {
      success: true,
      user: updatedUser,
      contractData: {
        tier: currentPlanFromContract,
        endTime: contractEndTime,
        dailyCredits: contractDailyCredits,
        isExpired,
        activePlan: currentPlan,
      },
    };
  } catch (error) {
    console.error("Failed to sync contract status:", error);
    return {
      success: false,
      error: "Failed to read contract status",
    };
  }
}

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

    // Refresh daily credits if needed (keep existing DB-based logic for daily refresh)
    const refreshedUser = await refreshDailyCredits(ctx.session?.userId);

    return {
      ...refreshedUser,
      isNewUser,
    };
  }),

  // New endpoint to sync contract status with database
  syncContractStatus: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().min(1, "Wallet address is required"),
        chainId: z.number().min(1, "Chain ID is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const result = await syncContractStatusToDatabase(
        ctx.session.userId,
        input.walletAddress,
        input.chainId,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Failed to sync contract status",
        });
      }

      return result;
    }),

  getBillingInfo: protectedProcedure.query(async ({ ctx }) => {
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

  // Updated subscription endpoint that now just syncs after transaction
  subscribeToPlan: protectedProcedure
    .input(
      z.object({
        plan: z.nativeEnum(PlanType),
        transactionHash: z.string().optional(),
        walletAddress: z.string().optional(),
        chainId: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // For free plan, just update database directly
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

      // For paid plans, verify transaction and sync with contract
      if (input.transactionHash && input.walletAddress && input.chainId) {
        try {
          const chain = getChainById(input.chainId);
          const contractAddress = getContractAddress(input.chainId);

          const receipt = await createPublicClient({
            chain,
            transport: http(),
          }).waitForTransactionReceipt({
            hash: input.transactionHash as Hex,
          });

          if (receipt.status !== "success") {
            return {
              success: false,
              error: "Transaction failed. Please try again.",
            };
          }

          // Verify the transaction was to our contract
          if (receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
            return {
              success: false,
              error:
                "Invalid transaction. Please use the subscription buttons.",
            };
          }

          // Transaction verified, now sync contract status with database
          const syncResult = await syncContractStatusToDatabase(
            ctx.session.userId,
            input.walletAddress,
            input.chainId,
          );

          if (!syncResult.success) {
            return {
              success: false,
              error: "Failed to sync subscription status from contract",
            };
          }

          return {
            success: true,
            plan: syncResult.user?.plan,
            credits: syncResult.user?.credits,
            dailyLimit: getDailyCreditLimit(
              syncResult.user?.plan ?? PlanType.FREE,
            ),
            subscriptionExpiresAt: syncResult.user?.subscriptionExpiresAt,
            message: `Successfully upgraded to ${syncResult.contractData?.activePlan ?? "premium"} plan!`,
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
