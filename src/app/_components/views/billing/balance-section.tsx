"use client";

import { api } from "@/trpc/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import DepositForm from "./deposit-form";

export default function BalanceSection() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const walletAddress = wallets[0]?.address;

  const {
    data: billingInfo,
    isLoading,
    error,
    refetch,
    isFetching,
  } = api.user.getBillingInfo.useQuery(
    { walletAddress: walletAddress ?? "" },
    {
      enabled: authenticated && !!walletAddress, // Only query when authenticated and wallet connected
    },
  );

  const handleRefreshBalance = async () => {
    try {
      await refetch();
      toast.success("Balance refreshed!");
    } catch (error) {
      toast.error(`Failed to refresh balance: ${error as string}`);
    }
  };

  if (!authenticated) {
    return (
      <section className="space-y-8 pb-[8vh]">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-0">
          <div className="group relative rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 sm:p-8 dark:bg-gray-900/50">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <p className="text-muted-foreground text-base font-semibold">
                    Available Balance
                  </p>
                  <div className="h-6 w-6 rounded-full bg-gray-200 opacity-50 dark:bg-gray-700"></div>
                </div>
                <div className="flex items-center justify-center gap-3 sm:justify-start">
                  <span className="text-muted-foreground text-2xl font-bold sm:text-3xl lg:text-4xl">
                    -- ETH
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Credits
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Connect your wallet to view balance
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl border-2 opacity-50 transition-all duration-200 hover:bg-gray-50 sm:w-auto dark:hover:bg-gray-900"
                  disabled
                >
                  View History
                </Button>
                <Button
                  size="lg"
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 sm:w-auto"
                  onClick={login}
                >
                  Connect to Add Funds
                </Button>
              </div>
            </div>

            <div className="relative mt-6 border-t pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <span className="text-muted-foreground text-sm font-medium">
                    Current Plan:
                  </span>
                  <span className="text-muted-foreground text-lg font-semibold">
                    Connect wallet to view
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-center sm:text-left">
                  <span className="text-muted-foreground text-sm font-medium">
                    Credits Used Today:
                  </span>
                  <span className="text-muted-foreground text-lg font-semibold">
                    -- / --
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!walletAddress) {
    return (
      <section className="space-y-8 pb-[8vh]">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-0">
          <div className="group relative rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 sm:p-8 dark:bg-gray-900/50">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-50"></div>
            <div className="relative text-center text-yellow-600">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Wallet not found</h3>
              <p className="text-muted-foreground text-sm">
                Please reconnect your wallet to view your balance
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="space-y-8 pb-[8vh]">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-0">
          <div className="group relative rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 sm:p-8 dark:bg-gray-900/50">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-50"></div>

            <div className="relative animate-pulse">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3 text-center sm:text-left">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="flex items-center justify-center gap-3 sm:justify-start">
                    <div className="h-10 w-40 rounded bg-gray-200 sm:h-12 sm:w-48 lg:h-14 lg:w-56 dark:bg-gray-700"></div>
                    <div className="h-8 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="mx-auto h-4 w-48 rounded bg-gray-200 sm:mx-0 dark:bg-gray-700"></div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="h-12 w-full rounded-xl bg-gray-200 sm:w-32 dark:bg-gray-700"></div>
                  <div className="h-12 w-full rounded-xl bg-gray-200 sm:w-28 dark:bg-gray-700"></div>
                </div>
              </div>

              <div className="relative mt-6 border-t pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-6 w-36 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-6 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-8 pb-[8vh]">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-0">
          <div className="group relative rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 sm:p-8 dark:bg-gray-900/50">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-pink-500/5 opacity-50"></div>
            <div className="relative text-center text-red-500">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                Failed to load balance information
              </h3>
              <p className="text-muted-foreground text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!billingInfo) {
    return null;
  }

  return (
    <section className="space-y-8 pb-[8vh]">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-0">
        <div className="group relative rounded-2xl border bg-white/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 sm:p-8 dark:bg-gray-900/50">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-50"></div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <p className="text-muted-foreground text-base font-semibold">
                  Available Balance
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 rounded-full p-0 hover:bg-gray-100"
                  onClick={handleRefreshBalance}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                <span className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                  {parseFloat(billingInfo.balance).toFixed(3)} ETH
                </span>
                <span className="rounded-full bg-gradient-to-r from-green-100 to-blue-100 px-3 py-1 text-sm font-medium text-green-800 dark:from-green-900 dark:to-blue-900 dark:text-green-300">
                  Credits
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Wallet balance: {walletAddress.slice(0, 6)}...
                {walletAddress.slice(-4)}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl border-2 transition-all duration-200 hover:bg-gray-50 sm:w-auto dark:hover:bg-gray-900"
              >
                View History
              </Button>
              <DepositForm currentBalance={billingInfo.balance} />
            </div>
          </div>

          <div className="relative mt-6 border-t pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <span className="text-muted-foreground text-sm font-medium">
                  Current Plan:
                </span>
                <span className="text-lg font-semibold">
                  {billingInfo.planDisplayName}
                </span>
              </div>
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <span className="text-muted-foreground text-sm font-medium">
                  Credits Used Today:
                </span>
                <span className="text-lg font-semibold">
                  {billingInfo.creditsUsedToday} / {billingInfo.dailyLimit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
