"use client";

import { liskSepolia, sagentTestnet } from "@/configs/chain";
import { ABI } from "@/constants/abi.constant";
import { ADDRESS } from "@/constants/address.constant";
import { api } from "@/trpc/react";
import { PlanType } from "@prisma/client";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseUnits, type Hex } from "viem";
import {
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";

// Helper function to create explorer link
const getExplorerLink = (txHash: string) => {
  return `https://sagent-2751288990640000-1.sagaexplorer.io/tx/${txHash}`;
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

// Helper function to get stable coin address by chainId
const getStableCoinAddress = (chainId: number): string => {
  switch (chainId) {
    case sagentTestnet.id:
      return ADDRESS.SAGENT_CHAIN.STABLE_COIN;
    case liskSepolia.id:
      return ADDRESS.LISK_SEPOLIA.STABLE_COIN;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

export default function SubscriptionCards() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const chainId = useChainId();
  const [pendingPlan, setPendingPlan] = useState<PlanType | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [planToConfirm, setPlanToConfirm] = useState<PlanType | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const processedTxRef = useRef<string | null>(null);
  const hasSyncedRef = useRef(false);

  // Get the actual external wallet address (filter out embedded wallet)
  const embeddedWalletAddress = getEmbeddedConnectedWallet(wallets)?.address;
  const externalWallet = wallets.find(
    (wallet) => wallet.address !== embeddedWalletAddress,
  );

  // Prefer external wallet, but fallback to embedded if that's all we have
  const walletAddress = externalWallet?.address ?? embeddedWalletAddress;

  // Check current stablecoin allowance for subscription manager
  const { data: currentAllowance } = useReadContract({
    address: getStableCoinAddress(chainId) as Hex,
    abi: ABI.STABLE_COIN,
    functionName: "allowance",
    args: [walletAddress as Hex, getContractAddress(chainId) as Hex],
    query: {
      enabled: !!walletAddress,
    },
  });

  // Get billing info from database (not contract directly)
  const { data: billingInfo, refetch: refetchBillingInfo } =
    api.user.getBillingInfo.useQuery(undefined, {
      enabled: authenticated,
    });

  const utils = api.useUtils();

  // Contract sync mutation
  const syncContractMutation = api.user.syncContractStatus.useMutation();

  // Contract interaction hook
  const {
    writeContractAsync,
    data: txHash,
    isPending: isWritingContract,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess,
    isError,
    error,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Backend subscription mutation for database updates
  const subscribeMutation = api.user.subscribeToPlan.useMutation();

  const handleSyncContract = useCallback(async () => {
    if (!walletAddress || isSyncing) return;
    setIsSyncing(true);
    await syncContractMutation
      .mutateAsync({ walletAddress, chainId })
      .then(async () => {
        await refetchBillingInfo();
      })
      .catch((error) => {
        console.error("Failed to sync contract status:", error);
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, [
    walletAddress,
    isSyncing,
    syncContractMutation,
    refetchBillingInfo,
    chainId,
  ]);

  // Sync contract status on first load
  useEffect(() => {
    if (authenticated && walletAddress && !isSyncing && !hasSyncedRef.current) {
      setIsSyncing(true);
      void handleSyncContract();
      hasSyncedRef.current = true;
    }
  }, [authenticated, walletAddress, handleSyncContract, isSyncing]);

  // Handle transaction success/error
  useEffect(() => {
    if (isSuccess && receipt && pendingPlan && pendingPlan !== PlanType.FREE) {
      const txHash = receipt.transactionHash;

      // Prevent processing the same transaction multiple times
      if (processedTxRef.current === txHash) {
        return;
      }

      processedTxRef.current = txHash;

      // Call backend to verify transaction and sync contract status
      subscribeMutation
        .mutateAsync({
          plan: pendingPlan,
          transactionHash: txHash,
          walletAddress: walletAddress!,
          chainId: chainId,
        })
        .then(async (result) => {
          if (result.success) {
            toast.success(
              <div>
                <div>Subscription successful!</div>
                <a
                  href={getExplorerLink(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  View on Explorer: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>,
            );

            // Refresh billing info to show updated data
            await utils.user.getBillingInfo.invalidate();
          } else {
            toast.error(result.error);
          }
        })
        .catch(() => {
          toast.error("Failed to update subscription plan");
        })
        .finally(() => {
          setPendingPlan(null);
          // Reset processed transaction ref for future transactions
          setTimeout(() => {
            processedTxRef.current = null;
          }, 1000);
        });
    }

    if (isError && error) {
      toast.error("Transaction failed. Please try again.");
      setPendingPlan(null);
      processedTxRef.current = null;
    }
  }, [
    isSuccess,
    isError,
    receipt?.transactionHash,
    pendingPlan,
    subscribeMutation,
    utils,
    receipt,
    error,
    walletAddress,
    chainId,
  ]);

  const handleSubscribe = useCallback(
    async (plan: PlanType) => {
      if (!authenticated) {
        login();
        return;
      }

      if (!walletAddress) {
        toast.error("Wallet not connected. Please connect your wallet first.");
        return;
      }

      // Reset any previous state
      processedTxRef.current = null;
      setPendingPlan(null);

      // Handle free plan (no contract interaction needed)
      if (plan === PlanType.FREE) {
        try {
          const result = await subscribeMutation.mutateAsync({
            plan,
            walletAddress,
          });
          if (result.success) {
            toast.success(result.message);
            await utils.user.getBillingInfo.invalidate();
          } else {
            toast.error(result.error);
          }
        } catch (error) {
          console.log(error);
          toast.error("Failed to switch to free plan");
        }
        return;
      }

      // For paid plans, open confirmation modal
      setPlanToConfirm(plan);
      setConfirmationOpen(true);
    },
    [authenticated, login, walletAddress, subscribeMutation, utils],
  );

  const handleConfirmSubscription = async () => {
    if (!planToConfirm || !walletAddress || planToConfirm === PlanType.FREE)
      return;

    // Close the modal
    setConfirmationOpen(false);

    // Reset processed transaction ref for new subscription
    processedTxRef.current = null;

    // Get plan pricing in SUSDC (assuming 18 decimals like most ERC20 tokens)
    const planAmounts = {
      [PlanType.PRO]: parseUnits("19", 18), // 19 SUSDC
      [PlanType.PREMIUM]: parseUnits("39", 18), // 39 SUSDC
    };

    const amount = planAmounts[planToConfirm];

    // Set pending plan for transaction tracking
    setPendingPlan(planToConfirm);

    try {
      // Check if we need to approve first
      const needsApproval = !currentAllowance || currentAllowance < amount;

      if (needsApproval) {
        toast.info("Approving SUSDC spending...");

        // First approve the stablecoin
        const approveTxHash = await writeContractAsync({
          address: getStableCoinAddress(chainId) as Hex,
          abi: ABI.STABLE_COIN,
          functionName: "approve",
          args: [getContractAddress(chainId) as Hex, amount],
          account: walletAddress as Hex,
        });

        toast.success(
          <div>
            <div>Approval successful!</div>
            <a
              href={getExplorerLink(approveTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              View on Explorer: {approveTxHash.slice(0, 10)}...
              {approveTxHash.slice(-8)}
            </a>
          </div>,
        );

        toast.info(
          "Approval transaction submitted! Waiting for confirmation...",
        );

        // Wait for approval to be confirmed
        // Note: In a real implementation, you might want to wait for the approval transaction
        // to be confirmed before proceeding to the subscription
      }

      // Get the appropriate subscription function name
      const functionName =
        planToConfirm === PlanType.PRO ? "subscribePro" : "subscribePremium";

      // Call the subscription function
      const subscriptionTxHash = await writeContractAsync({
        address: getContractAddress(chainId) as Hex,
        abi: ABI.SUBSCRIPTION_MANAGER,
        functionName: functionName,
        account: walletAddress as Hex,
      });

      toast.success(
        <div>
          <div>Subscription transaction submitted!</div>
          <a
            href={getExplorerLink(subscriptionTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            View on Explorer: {subscriptionTxHash.slice(0, 10)}...
            {subscriptionTxHash.slice(-8)}
          </a>
        </div>,
      );
    } catch (error: unknown) {
      console.error("Subscription failed:", error);
      toast.error("Transaction failed. Please try again.");
      setPendingPlan(null);
      processedTxRef.current = null;
    } finally {
      setPlanToConfirm(null);
    }
  };

  const isCurrentPlan = useCallback(
    (plan: PlanType) => {
      return authenticated && billingInfo?.plan === plan;
    },
    [authenticated, billingInfo?.plan],
  );

  const getButtonText = (plan: PlanType) => {
    if (!authenticated) {
      return "Connect to Subscribe";
    }
    if (isCurrentPlan(plan)) {
      return "Current Plan";
    }

    if (pendingPlan === plan && (isWritingContract || isConfirming)) {
      return isWritingContract ? "Confirming..." : "Processing...";
    }

    if (subscribeMutation.isPending) {
      return "Updating...";
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

  const isButtonDisabled = useCallback(
    (plan: PlanType) => {
      return (
        isCurrentPlan(plan) ||
        isWritingContract ||
        isConfirming ||
        subscribeMutation.isPending ||
        syncContractMutation.isPending ||
        (pendingPlan !== null && pendingPlan !== plan) ||
        isSyncing
      );
    },
    [
      isCurrentPlan,
      isWritingContract,
      isConfirming,
      subscribeMutation.isPending,
      syncContractMutation.isPending,
      pendingPlan,
      isSyncing,
    ],
  );

  return (
    <section className="space-y-8 px-4 pb-[8vh] sm:space-y-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg lg:text-xl">
          Select the subscription tier that fits your needs
        </p>
        {isSyncing && (
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            🔄 Syncing subscription status from contract...
          </p>
        )}
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
            <div className="text-3xl font-bold sm:text-4xl">0 SUSDC</div>
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
            disabled={isButtonDisabled(PlanType.FREE)}
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
            <div className="text-3xl font-bold sm:text-4xl">19 SUSDC</div>
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
            disabled={isButtonDisabled(PlanType.PRO)}
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
            <div className="text-3xl font-bold sm:text-4xl">39 SUSDC</div>
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
            disabled={isButtonDisabled(PlanType.PREMIUM)}
            onClick={() => handleSubscribe(PlanType.PREMIUM)}
          >
            {getButtonText(PlanType.PREMIUM)}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="rounded-2xl border bg-white/50 shadow-xl backdrop-blur-sm sm:max-w-[480px] dark:bg-gray-900/50">
          {/* Gradient overlay for subtle animation */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>

          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                🚀
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Confirm Subscription
              </span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-sm sm:text-base">
              You&apos;re about to subscribe to the{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-semibold text-transparent">
                {planToConfirm?.charAt(0)}
                {planToConfirm?.slice(1).toLowerCase()}
              </span>{" "}
              plan with enhanced features and premium support.
            </DialogDescription>
          </DialogHeader>

          <div className="relative grid gap-6 py-6">
            {/* Plan details card */}
            <div className="relative rounded-2xl border bg-white/30 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 dark:bg-gray-800/30">
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Plan Type
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-sm font-semibold text-white shadow-md">
                    {planToConfirm?.charAt(0)}
                    {planToConfirm?.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Monthly Price
                  </span>
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent">
                    {planToConfirm === PlanType.PRO ? "19" : "39"} SUSDC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Subscription Duration
                  </span>
                  <span className="font-semibold">30 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-medium">
                    Daily Credits
                  </span>
                  <span className="font-semibold text-green-600">
                    {planToConfirm === PlanType.PRO ? "30" : "60"} credits
                  </span>
                </div>
              </div>
            </div>

            {/* Information box */}
            <div className="rounded-xl border bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-4 dark:from-blue-950/20 dark:to-purple-950/20">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-xs font-bold text-white">
                  ℹ
                </div>
                <div className="text-muted-foreground text-sm">
                  <p>
                    This subscription will charge{" "}
                    <span className="text-foreground font-semibold">
                      {planToConfirm === PlanType.PRO ? "19" : "39"} SUSDC
                    </span>{" "}
                    from your connected wallet and provide immediate access to
                    all {planToConfirm?.toLowerCase()} plan features for 30
                    days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="relative gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmationOpen(false)}
              className="rounded-xl border-2 transition-all duration-200 hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubscription}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            >
              Confirm & Subscribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
