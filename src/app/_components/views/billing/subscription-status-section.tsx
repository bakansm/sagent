"use client";

import { ABI } from "@/constants/abi";
import { ADDRESS } from "@/constants/address";
import { api } from "@/trpc/react";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import {
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { Hex } from "viem";
import { useReadContract } from "wagmi";

export default function SubscriptionStatusSection() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Get the actual external wallet address (filter out embedded wallet)
  const embeddedWalletAddress = getEmbeddedConnectedWallet(wallets)?.address;
  const externalWallet = wallets.find(
    (wallet) => wallet.address !== embeddedWalletAddress,
  );

  // Prefer external wallet, but fallback to embedded if that's all we have
  const walletAddress = externalWallet?.address ?? embeddedWalletAddress;

  // Get user data from database
  const { data: user } = api.user.getUser.useQuery(undefined, {
    enabled: authenticated,
  });

  // Read subscription status from contract
  const { data: subscriptionStatus, isLoading: isLoadingContract } =
    useReadContract({
      address: ADDRESS.SUBSCRIPTION_MANAGER as Hex,
      abi: ABI.SUBSCRIPTION_MANAGER,
      functionName: "getMySubscriptionStatus",
      account: walletAddress as Hex,
      query: {
        enabled: authenticated && !!walletAddress,
      },
    });

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

  // Parse contract data
  const contractTier = subscriptionStatus?.[0];
  const contractEndTime = subscriptionStatus?.[1];
  const contractDailyCredits = subscriptionStatus?.[2];

  // Map contract tier to plan type
  const getTierName = (tier: number) => {
    switch (tier) {
      case 0:
        return "FREE";
      case 1:
        return "PRO";
      case 2:
        return "PREMIUM";
      default:
        return "UNKNOWN";
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = contractEndTime
    ? Number(contractEndTime) * 1000 < Date.now()
    : false;
  const daysRemaining = contractEndTime
    ? Math.max(
        0,
        Math.ceil(
          (Number(contractEndTime) * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
            Subscription Status
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Current subscription details from smart contract
          </p>
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
                    {isLoadingContract
                      ? "Loading..."
                      : contractTier !== undefined &&
                          contractEndTime !== undefined
                        ? contractTier === 0 || contractEndTime === 0n
                          ? "Unlimited"
                          : isExpired
                            ? "Expired"
                            : `${daysRemaining} days`
                        : "Contract Unavailable"}
                  </p>
                  {!isLoadingContract &&
                    (contractTier === undefined ||
                      contractEndTime === undefined) && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Cannot read from contract
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
                    {isLoadingContract
                      ? "Loading..."
                      : contractDailyCredits !== undefined
                        ? String(contractDailyCredits)
                        : "Contract Unavailable"}
                  </p>
                  {!isLoadingContract && contractDailyCredits === undefined && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Cannot read from contract
                    </p>
                  )}
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
                    {contractTier === 0 || !contractEndTime
                      ? "Unlimited"
                      : isExpired
                        ? "Expired"
                        : `${daysRemaining} days`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="rounded-2xl border bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-900/50">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CalendarIcon className="h-5 w-5" />
            Contract & Database Details
          </h3>
          <div className="mb-4 rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">ℹ️ Data Priority:</span> Contract
              data is the source of truth. Database values are shown for
              comparison.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Contract Plan
              </p>
              <p className="text-base font-semibold">
                {isLoadingContract
                  ? "Loading..."
                  : contractTier !== undefined
                    ? `${getTierName(contractTier)}`
                    : "Not available"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Database Plan
              </p>
              <p className="text-base font-semibold">{user.plan}</p>
            </div>

            {contractEndTime && contractTier !== 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subscription Expires
                </p>
                <p className="text-base font-semibold">
                  {formatTimestamp(contractEndTime)}
                  {isExpired && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Expired
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Contract Status */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Contract connection:
              </span>
              <span
                className={`text-sm font-medium ${
                  !isLoadingContract && contractTier !== undefined
                    ? "text-green-600 dark:text-green-400"
                    : isLoadingContract
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {isLoadingContract
                  ? "🔄 Loading..."
                  : contractTier !== undefined
                    ? "✓ Connected"
                    : "❌ Disconnected"}
              </span>
            </div>
            {contractTier !== undefined && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Database sync:
                </span>
                <span
                  className={`text-sm font-medium ${
                    getTierName(contractTier) === user.plan
                      ? "text-green-600 dark:text-green-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {getTierName(contractTier) === user.plan
                    ? "✓ In Sync"
                    : "⚠ Out of Sync"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
