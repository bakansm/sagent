"use client";

import { api } from "@/trpc/react";
import { PlanType } from "@prisma/client";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import {
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

export default function SubscriptionStatusSection() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [isSyncing, setIsSyncing] = useState(false);

  // Get the actual external wallet address (filter out embedded wallet)
  const embeddedWalletAddress = getEmbeddedConnectedWallet(wallets)?.address;
  const externalWallet = wallets.find(
    (wallet) => wallet.address !== embeddedWalletAddress,
  );

  // Prefer external wallet, but fallback to embedded if that's all we have
  const walletAddress = externalWallet?.address ?? embeddedWalletAddress;

  console.log("wallets: ", wallets);
  console.log("embeddedWalletAddress: ", embeddedWalletAddress);
  console.log("externalWallet: ", externalWallet);
  console.log("walletAddress: ", walletAddress);

  // Get user data from database
  const { data: user } = api.user.getUser.useQuery(undefined, {
    enabled: authenticated,
  });

  // Get billing info from database
  const { data: billingInfo, refetch: refetchBillingInfo } =
    api.user.getBillingInfo.useQuery(undefined, {
      enabled: authenticated,
    });

  // Contract sync mutation
  const syncContractMutation = api.user.syncContractStatus.useMutation();

  const handleSyncContract = useCallback(async () => {
    if (!walletAddress || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncContractMutation.mutateAsync({ walletAddress });
      await refetchBillingInfo();
    } catch (error) {
      console.error("Failed to sync contract status:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [walletAddress, isSyncing, syncContractMutation, refetchBillingInfo]);

  const formatTimestamp = (date: Date | string | null) => {
    if (!date) return null;
    const expiration = new Date(date);
    return expiration.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = billingInfo?.subscriptionExpiresAt
    ? new Date(billingInfo.subscriptionExpiresAt) <= new Date()
    : false;

  const daysRemaining =
    billingInfo?.subscriptionExpiresAt && !isExpired
      ? Math.max(
          0,
          Math.ceil(
            (new Date(billingInfo.subscriptionExpiresAt).getTime() -
              Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  if (!authenticated || !user) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-white/50 p-8 text-center backdrop-blur-sm dark:bg-gray-900/50">
          <p className="text-muted-foreground">
            Please connect your wallet to view subscription status
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div>
              <h2 className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                Subscription Status
              </h2>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Current subscription details synced from smart contract
              </p>
            </div>
            <button
              onClick={handleSyncContract}
              disabled={isSyncing || !walletAddress}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900/50 dark:hover:bg-gray-900/70"
              title="Sync with contract"
            >
              <RefreshCwIcon
                className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Plan */}
          <div className="group relative overflow-hidden rounded-2xl border bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg dark:bg-gray-900/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Current Plan
                  </p>
                  <p className="text-lg font-bold">
                    {billingInfo?.plan ?? "Loading..."}
                  </p>
                  {isExpired && billingInfo?.plan !== PlanType.FREE && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Expired
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Credits */}
          <div className="group relative overflow-hidden rounded-2xl border bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg dark:bg-gray-900/50">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                  <CreditCardIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Daily Credits
                  </p>
                  <p className="text-lg font-bold">
                    {billingInfo?.dailyLimit ?? "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credits Used Today */}
          <div className="group relative overflow-hidden rounded-2xl border bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg dark:bg-gray-900/50">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
                  <TrendingUpIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Used Today
                  </p>
                  <p className="text-lg font-bold">{user.creditsUsedToday}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="group relative overflow-hidden rounded-2xl border bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg dark:bg-gray-900/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                  <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-lg font-bold">
                    {billingInfo?.plan === PlanType.FREE
                      ? "Unlimited"
                      : isExpired
                        ? "Expired"
                        : `${daysRemaining} days`}
                  </p>
                  {billingInfo?.plan !== PlanType.FREE && isExpired && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Renew required
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="rounded-2xl border bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-900/50">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CalendarIcon className="h-5 w-5" />
            Subscription Details
          </h3>

          {/* Warning for expired subscriptions */}
          {isExpired && billingInfo?.plan !== PlanType.FREE && (
            <div className="mb-4 rounded-lg bg-red-50/50 p-3 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 text-red-600 dark:text-red-400">⚠️</div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-semibold">Subscription Expired:</span>{" "}
                  Your {billingInfo?.plan?.toLowerCase()} subscription has
                  expired. Please renew to continue using premium features.
                </p>
              </div>
            </div>
          )}

          <div className="mb-4 rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">ℹ️ Data Source:</span>{" "}
              Subscription status is synced from the smart contract and stored
              in our database for fast access.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Plan
              </p>
              <p className="text-base font-semibold">
                {billingInfo?.plan ?? "Loading..."}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Daily Credits
              </p>
              <p className="text-base font-semibold">
                {billingInfo?.dailyLimit ?? "Loading..."}
              </p>
            </div>

            {billingInfo?.subscriptionExpiresAt &&
              billingInfo.plan !== PlanType.FREE && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Subscription Expires
                  </p>
                  <p className="text-base font-semibold">
                    {formatTimestamp(billingInfo.subscriptionExpiresAt)}
                    {isExpired && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Expired
                      </span>
                    )}
                  </p>
                </div>
              )}
          </div>

          {/* Sync Status */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Contract sync:
              </span>
              <span
                className={`text-sm font-medium ${
                  !isSyncing
                    ? "text-green-600 dark:text-green-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {isSyncing ? "🔄 Syncing..." : "✓ Synced"}
              </span>
            </div>
            {walletAddress && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Wallet connected:
                </span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
