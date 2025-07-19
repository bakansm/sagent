import { PlanType } from "@prisma/client";
import { db } from "./db.lib";

/**
 * Get daily credit limit based on plan type
 */
export function getDailyCreditLimit(plan: PlanType): number {
  switch (plan) {
    case PlanType.FREE:
      return 5;
    case PlanType.PRO:
      return 30;
    case PlanType.PREMIUM:
      return 60;
    default:
      return 5;
  }
}

/**
 * Checks if a user needs daily credit refresh and updates credits accordingly
 * Also handles subscription expiration for paid plans
 * Free: 5 credits per day
 * Pro: 30 credits per day (expires after 30 days)
 * Premium: 60 credits per day (expires after 30 days)
 */
export async function refreshDailyCredits(userId: string) {
  const now = new Date();
  let user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  // Check if subscription expired and downgrade to free plan
  let planToUse = user.plan;
  let subscriptionExpiresAt = user.subscriptionExpiresAt;

  if (user.subscriptionExpiresAt && user.subscriptionExpiresAt <= now) {
    planToUse = PlanType.FREE;
    subscriptionExpiresAt = null;

    // Update user plan to free due to expiration
    user = await db.user.update({
      where: { id: userId },
      data: {
        plan: PlanType.FREE,
        subscriptionExpiresAt: null,
      },
    });
  }

  // Check if it's a new day since last refresh
  const lastRefreshDate = user.lastCreditRefresh.toDateString();
  const currentDate = now.toDateString();

  if (lastRefreshDate !== currentDate) {
    // Determine daily credit limit based on current plan (after expiration check)
    const dailyCredits = getDailyCreditLimit(planToUse);

    // Update user credits and refresh timestamp, reset daily usage
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        plan: planToUse,
        credits: dailyCredits,
        creditsUsedToday: 0,
        lastCreditRefresh: now,
        subscriptionExpiresAt: subscriptionExpiresAt,
      },
    });

    return updatedUser;
  }

  return user;
}

/**
 * Deduct credits from user's daily allowance
 */
export async function deductCredits(userId: string, amount = 1) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.credits < amount) {
    throw new Error("Insufficient credits");
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      credits: user.credits - amount,
      creditsUsedToday: user.creditsUsedToday + amount,
    },
  });

  return updatedUser;
}
