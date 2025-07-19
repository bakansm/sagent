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
  const updatePlanMutation = api.user.updatePlan.useMutation({
    onSuccess: async (data) => {
      toast.success(`Successfully upgraded to ${data.plan} plan!`);
      await utils.user.getBillingInfo.invalidate();
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

    updatePlanMutation.mutate({ plan });
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
    return `Subscribe to ${plan.charAt(0) + plan.slice(1).toLowerCase()}`;
  };

  return (
    <section className="space-y-6 px-4 pb-[8vh] sm:space-y-8 sm:px-0">
      <div className="text-center">
        <h2 className="text-lg font-semibold sm:text-xl lg:text-3xl">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground mt-2 text-xs sm:text-sm lg:text-base">
          Select the subscription tier that fits your needs
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {/* Free Tier */}
        <div className="bg-card flex flex-col rounded-lg border p-4 sm:p-6">
          <div className="text-center">
            <h3 className="text-base font-semibold sm:text-lg">Free</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Default plan
            </p>
          </div>
          <div className="mt-3 text-center sm:mt-4">
            <div className="text-xl font-bold sm:text-2xl">0 ETH</div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              per month
            </p>
          </div>
          <div className="mt-3 flex-1 space-y-1.5 sm:mt-4 sm:space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">5 credits per day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">Basic support</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full text-xs sm:mt-6 sm:text-sm"
            disabled={isCurrentPlan(PlanType.FREE)}
            onClick={() => handleSubscribe(PlanType.FREE)}
          >
            {getButtonText(PlanType.FREE)}
          </Button>
        </div>

        {/* Pro Tier */}
        <div className="bg-card border-primary relative flex flex-col rounded-lg border p-4 sm:p-6">
          {/* Popular badge for mobile */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 transform sm:hidden">
            <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium">
              Most Popular
            </span>
          </div>
          <div className="text-center">
            <h3 className="text-base font-semibold sm:text-lg">Pro</h3>
            <p className="text-muted-foreground hidden text-xs sm:block sm:text-sm">
              Most popular
            </p>
          </div>
          <div className="mt-3 text-center sm:mt-4">
            <div className="text-xl font-bold sm:text-2xl">0.005 ETH</div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              per month
            </p>
          </div>
          <div className="mt-3 flex-1 space-y-1.5 sm:mt-4 sm:space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">30 credits per day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">Priority support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">Advanced features</span>
            </div>
          </div>
          <Button
            className="mt-4 w-full text-xs sm:mt-6 sm:text-sm"
            disabled={
              isCurrentPlan(PlanType.PRO) || updatePlanMutation.isPending
            }
            onClick={() => handleSubscribe(PlanType.PRO)}
          >
            {updatePlanMutation.isPending && !authenticated
              ? "Connecting..."
              : getButtonText(PlanType.PRO)}
          </Button>
        </div>

        {/* Premium Tier */}
        <div className="bg-card flex flex-col rounded-lg border p-4 sm:col-span-2 sm:p-6 lg:col-span-1">
          <div className="text-center">
            <h3 className="text-base font-semibold sm:text-lg">Premium</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              For power users
            </p>
          </div>
          <div className="mt-3 text-center sm:mt-4">
            <div className="text-xl font-bold sm:text-2xl">0.01 ETH</div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              per month
            </p>
          </div>
          <div className="mt-3 flex-1 space-y-1.5 sm:mt-4 sm:space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">60 credits per day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">24/7 premium support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">All premium features</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-500">✓</span>
              <span className="text-xs sm:text-sm">
                Early access to new features
              </span>
            </div>
          </div>
          <Button
            className="mt-4 w-full text-xs sm:mt-6 sm:text-sm"
            disabled={
              isCurrentPlan(PlanType.PREMIUM) || updatePlanMutation.isPending
            }
            onClick={() => handleSubscribe(PlanType.PREMIUM)}
          >
            {updatePlanMutation.isPending && !authenticated
              ? "Connecting..."
              : getButtonText(PlanType.PREMIUM)}
          </Button>
        </div>
      </div>
    </section>
  );
}
