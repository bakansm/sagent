"use client";

import { address } from "@/contract/address";
import { sagentChain } from "@/contract/chain";
import { api } from "@/trpc/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { Hex } from "@privy-io/server-auth";
import { Loader2Icon, PlusIcon, SendIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useEstimateGas, useSendTransaction } from "wagmi";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Input } from "../../ui/input";

interface DepositFormProps {
  currentBalance?: string;
}

export default function DepositForm({
  currentBalance = "0",
}: DepositFormProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  // Prepare transaction data for gas estimation
  const transactionRequest = useMemo(() => {
    if (
      !depositAmount ||
      !wallets[0]?.address ||
      parseFloat(depositAmount) <= 0
    ) {
      return undefined;
    }

    try {
      return {
        to: address.sagent as Hex,
        value: parseEther(depositAmount),
        account: wallets[0]?.address as Hex,
      };
    } catch {
      return undefined;
    }
  }, [depositAmount, wallets]);

  // Estimate gas dynamically
  const { data: estimatedGas } = useEstimateGas({
    ...transactionRequest,
    query: {
      enabled: !!transactionRequest,
    },
  });

  // Use estimated gas with 20% buffer, fallback to optimized base
  const finalGas = useMemo(() => {
    if (estimatedGas) {
      // Add 20% buffer to estimated gas
      return (estimatedGas * BigInt(120)) / BigInt(100);
    }
    // Optimized fallback: much lower base gas for simple transfers
    return BigInt(25000); // More reasonable base for ETH transfers (21k base + small buffer)
  }, [estimatedGas]);

  const { isPending: isTransactionPending, sendTransaction } =
    useSendTransaction({
      mutation: {
        onSuccess: (hash) => {
          console.log("Transaction sent:", hash);
          toast.success("Transaction sent! Updating balance...");
          // Now update the database
          depositMutation.mutate({ amount: depositAmount });
        },
        onError: (error) => {
          console.error("Transaction failed:", error);
          toast.error(`Transaction failed: ${error.message}`);
        },
      },
    });

  const utils = api.useUtils();
  const depositMutation = api.user.depositBalance.useMutation({
    onSuccess: async (data) => {
      toast.success(`Successfully deposited ${data.depositAmount} ETH`);
      setDepositAmount("");
      setIsOpen(false);
      // Invalidate and refetch billing info
      await utils.user.getBillingInfo.invalidate();
    },
    onError: (error) => {
      toast.error(`Database update failed: ${error.message}`);
    },
  });

  const handleDepositClick = () => {
    if (!authenticated) {
      // Close dialog and trigger login
      setIsOpen(false);
      login();
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const walletAddress = wallets[0]?.address;
    if (!walletAddress) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const amountInWei = parseEther(depositAmount);

      console.log("Sending transaction:", {
        to: address.sagent,
        value: amountInWei,
        gas: finalGas,
        estimated: estimatedGas,
        amount: depositAmount,
      });

      sendTransaction({
        to: address.sagent as Hex,
        value: amountInWei,
        chainId: sagentChain.id,
        account: walletAddress as Hex,
        gas: finalGas,
      });
    } catch (error) {
      console.error("Error preparing transaction:", error);
      toast.error("Failed to prepare transaction");
    }
  };

  const handleCancel = () => {
    setDepositAmount("");
    setIsOpen(false);
  };

  const currentBalanceNum = parseFloat(currentBalance);
  const depositAmountNum = parseFloat(depositAmount || "0");
  const newBalance = currentBalanceNum + depositAmountNum;

  const isProcessing = isTransactionPending || depositMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="h-12 w-full rounded-xl bg-gradient-to-r from-green-600 to-blue-600 text-white transition-all duration-200 hover:scale-105 hover:from-green-700 hover:to-blue-700 sm:w-auto"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-white/20 bg-white/95 shadow-2xl backdrop-blur-md sm:max-w-lg dark:border-gray-800/30 dark:bg-gray-900/95">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-50"></div>

        <div className="relative">
          <DialogHeader className="space-y-3 pb-6">
            <div className="mb-4 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-green-500/20 blur-lg"></div>
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
                  <PlusIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <DialogTitle className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-center text-2xl font-bold text-transparent">
              Deposit ETH
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center text-base">
              Add funds to your Sagent account securely
            </DialogDescription>
          </DialogHeader>

          {authenticated ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label
                  htmlFor="amount"
                  className="flex items-center gap-2 text-base font-semibold"
                >
                  <span>Amount (ETH)</span>
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Ξ
                    </span>
                  </div>
                </label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-14 rounded-xl border-2 text-base transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  disabled={isProcessing}
                />
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Current balance:{" "}
                  <span className="font-medium">{currentBalance} ETH</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-gray-50/80 to-blue-50/80 p-5 backdrop-blur-sm dark:border-gray-800/50 dark:from-gray-900/80 dark:to-blue-950/80">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Current Balance:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentBalanceNum.toFixed(3)} ETH
                    </span>
                  </div>
                  {depositAmount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">
                        New Balance:
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {newBalance.toFixed(3)} ETH
                      </span>
                    </div>
                  )}
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200/50 pt-2 text-sm dark:border-gray-700/50">
                      <span className="text-muted-foreground font-medium">
                        Estimated Gas:
                      </span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {estimatedGas
                          ? `${Number(finalGas).toLocaleString()} (${Number(estimatedGas).toLocaleString()} + 20%)`
                          : `${Number(finalGas).toLocaleString()} (fallback)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isTransactionPending && (
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 backdrop-blur-sm dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Transaction in progress... Please check your wallet.
                    </p>
                  </div>
                </div>
              )}

              {depositMutation.isPending && (
                <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 backdrop-blur-sm dark:border-green-800 dark:from-green-950 dark:to-emerald-950">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                      <span className="text-green-600 dark:text-green-400">
                        ✓
                      </span>
                    </div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Transaction confirmed! Updating your balance...
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50">
                <PlusIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground text-base">
                You need to connect your wallet before making deposits.
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              className="h-12 flex-1 rounded-xl border-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDepositClick}
              disabled={
                authenticated &&
                (!depositAmount ||
                  parseFloat(depositAmount) <= 0 ||
                  isProcessing)
              }
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 text-white transition-all duration-200 hover:scale-105 hover:from-green-700 hover:to-blue-700"
            >
              {!authenticated ? (
                <>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              ) : isTransactionPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Confirming Transaction...
                </>
              ) : depositMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Updating Balance...
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Deposit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
