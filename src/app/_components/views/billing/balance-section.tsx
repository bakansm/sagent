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
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-0">
          <div className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <p className="text-muted-foreground text-sm font-medium">
                    Available Balance
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <span className="text-muted-foreground text-xl font-bold sm:text-2xl">
                    -- ETH
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    Credits
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled
                >
                  View History
                </Button>
                <Button size="sm" className="w-full sm:w-auto" onClick={login}>
                  Connect to Add Funds
                </Button>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="space-y-2 sm:space-y-1">
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <span className="text-muted-foreground font-medium">
                    Connect wallet to view
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-muted-foreground">
                    Credits Used Today:
                  </span>
                  <span className="text-muted-foreground font-medium">
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
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-0">
          <div className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
            <div className="text-center text-yellow-600">
              <p>Wallet not found</p>
              <p className="text-muted-foreground text-sm">
                Please reconnect your wallet
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
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-0">
          <div className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
            <div className="animate-pulse">
              <div className="mb-2 h-4 w-1/4 rounded bg-gray-200"></div>
              <div className="mb-4 h-8 w-1/2 rounded bg-gray-200"></div>
              <div className="mb-4 h-px bg-gray-200"></div>
              <div className="space-y-2">
                <div className="h-4 rounded bg-gray-200"></div>
                <div className="h-4 rounded bg-gray-200"></div>
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
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-0">
          <div className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
            <div className="text-center text-red-500">
              <p>Failed to load balance information</p>
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
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-0">
        <div className="bg-card rounded-lg border p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <p className="text-muted-foreground text-sm font-medium">
                  Available Balance
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={handleRefreshBalance}
                  disabled={isFetching}
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-xl font-bold sm:text-2xl">
                  {parseFloat(billingInfo.balance).toFixed(3)} ETH
                </span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  Credits
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Wallet balance: {walletAddress.slice(0, 6)}...
                {walletAddress.slice(-4)}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                View History
              </Button>
              <DepositForm currentBalance={billingInfo.balance} />
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="space-y-2 sm:space-y-1">
              <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-medium">
                  {billingInfo.planDisplayName}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">
                  Credits Used Today:
                </span>
                <span className="font-medium">
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
