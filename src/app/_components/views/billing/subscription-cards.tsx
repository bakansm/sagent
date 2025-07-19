"use client";

import { api } from "@/trpc/react";
import { PlanType } from "@prisma/client";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import { Button } from "../../ui/button";

export default function SubscriptionCards() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const walletAddress = wallets[0]?.address;

  const { data: billingInfo } = api.user.getBillingInfo.useQuery(
    { walletAddress: walletAddress ?? "" },
    {
      enabled: authenticated && !!walletAddress,
    },
  );

  const utils = api.useUtils();

  // Subscription mutation with smart contract withdrawal
  const subscribeMutation = api.user.subscribeToPlan.useMutation({
    onSuccess: async (data) => {
      if (data.success) {
        toast.success(data.message);
        if (data.transactionHash) {
          toast.info(
            `Payment processed: ${data.transactionHash.slice(0, 10)}...`,
          );
        }
        await utils.user.getBillingInfo.invalidate();
      } else {
        toast.error(data.error);

        // If insufficient balance, suggest adding funds
        if (data.error?.includes("Insufficient balance")) {
          toast.info("Please add more funds to your account to subscribe.");
        }
      }
    },
    onError: (error) => {
      toast.error(`Subscription failed: ${error.message}`);
    },
  });

  const handleSubscribe = (plan: PlanType) => {
    if (!authenticated) {
      login();
      return;
    }

    if (!walletAddress) {
      toast.error("Wallet not connected. Please connect your wallet first.");
      return;
    }

    // Show confirmation for paid plans
    if (plan !== PlanType.FREE) {
      const planCosts = {
        [PlanType.PRO]: "0.005 ETH",
        [PlanType.PREMIUM]: "0.01 ETH",
      };

      const cost = planCosts[plan];
      const confirmMessage = `Subscribe to ${plan} plan for ${cost}? This will automatically withdraw ${cost} from your deposited balance and give you 30 days of access.`;

      if (!confirm(confirmMessage)) {
        return;
      }
    }

    subscribeMutation.mutate({
      plan,
      walletAddress,
    });
  };

  const isCurrentPlan = (plan: PlanType) => {
    return authenticated && billingInfo?.plan === plan;
  };

  const getButtonText = (plan: PlanType) => {
    if (!authenticated) {
      return "Connect to Subscribe";
    }
    if (isCurrentPlan(plan)) {
      return "Current Plan";
    }

    if (subscribeMutation.isPending) {
      return "Processing...";
    }

    return `Subscribe to ${plan.charAt(0) + plan.slice(1).toLowerCase()}`;
  };

  const getButtonVariant = (plan: PlanType) => {
    if (isCurrentPlan(plan)) {
      return "outline" as const;
    }
    return undefined;
  };

  const formatExpirationDate = (date: Date | string | null) => {
    if (!date) return null;
    const expiration = new Date(date);
    return expiration.toLocaleDateString();
  };

  return (
    <section className="space-y-8 px-4 pb-[8vh] sm:space-y-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg lg:text-xl">
          Select the subscription tier that fits your needs
        </p>
        {billingInfo?.subscriptionExpiresAt && (
          <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
            Current subscription expires on{" "}
            {formatExpirationDate(billingInfo.subscriptionExpiresAt)}
          </p>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {/* Free Tier */}
        <div className="group relative flex flex-col rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl sm:p-8 dark:bg-gray-900/50">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-500/5 to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="relative text-center">
            <h3 className="text-xl font-bold sm:text-2xl">Free</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Default plan
            </p>
          </div>
          <div className="relative mt-6 text-center">
            <div className="text-3xl font-bold sm:text-4xl">0 ETH</div>
            <p className="text-muted-foreground text-sm sm:text-base">
              per month
            </p>
          </div>
          <div className="relative mt-6 flex-1 space-y-3 sm:mt-8 sm:space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">5 credits per day</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">Basic support</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-gray-400">✓</span>
              <span className="text-sm text-gray-500 sm:text-base">
                No expiration
              </span>
            </div>
          </div>
          <Button
            variant={getButtonVariant(PlanType.FREE)}
            className="relative mt-8 w-full rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 sm:text-base"
            disabled={
              isCurrentPlan(PlanType.FREE) || subscribeMutation.isPending
            }
            onClick={() => handleSubscribe(PlanType.FREE)}
          >
            {getButtonText(PlanType.FREE)}
          </Button>
        </div>

        {/* Pro Tier */}
        <div className="group relative flex flex-col rounded-2xl border-2 border-blue-500/50 bg-white/50 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:p-8 dark:bg-gray-900/50">
          {/* Popular badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
            <span className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
              Most Popular
            </span>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50"></div>
          <div className="relative pt-4 text-center">
            <h3 className="text-xl font-bold sm:text-2xl">Pro</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Most popular
            </p>
          </div>
          <div className="relative mt-6 text-center">
            <div className="text-3xl font-bold sm:text-4xl">0.005 ETH</div>
            <p className="text-muted-foreground text-sm sm:text-base">
              per month
            </p>
          </div>
          <div className="relative mt-6 flex-1 space-y-3 sm:mt-8 sm:space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">30 credits per day</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">Advanced features</span>
            </div>
          </div>
          <Button
            variant={getButtonVariant(PlanType.PRO)}
            className="relative mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 sm:text-base"
            disabled={
              isCurrentPlan(PlanType.PRO) || subscribeMutation.isPending
            }
            onClick={() => handleSubscribe(PlanType.PRO)}
          >
            {getButtonText(PlanType.PRO)}
          </Button>
        </div>

        {/* Premium Tier */}
        <div className="group relative flex flex-col rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl sm:col-span-2 sm:p-8 lg:col-span-1 dark:bg-gray-900/50">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="relative text-center">
            <h3 className="text-xl font-bold sm:text-2xl">Premium</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              For power users
            </p>
          </div>
          <div className="relative mt-6 text-center">
            <div className="text-3xl font-bold sm:text-4xl">0.01 ETH</div>
            <p className="text-muted-foreground text-sm sm:text-base">
              per month
            </p>
          </div>
          <div className="relative mt-6 flex-1 space-y-3 sm:mt-8 sm:space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">60 credits per day</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">24/7 premium support</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">All premium features</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-green-500">✓</span>
              <span className="text-sm sm:text-base">
                Early access to new features
              </span>
            </div>
          </div>
          <Button
            variant={getButtonVariant(PlanType.PREMIUM)}
            className="relative mt-8 w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-pink-700 sm:text-base"
            disabled={
              isCurrentPlan(PlanType.PREMIUM) || subscribeMutation.isPending
            }
            onClick={() => handleSubscribe(PlanType.PREMIUM)}
          >
            {getButtonText(PlanType.PREMIUM)}
          </Button>
        </div>
      </div>
    </section>
  );
}
