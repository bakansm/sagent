"use client";

import { address } from "@/contract/address";
import { sagentChain } from "@/contract/chain";
import { api } from "@/trpc/react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { Hex } from "@privy-io/server-auth";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useEstimateGas, useSendTransaction } from "wagmi";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";

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
        <Button size="sm" className="w-full sm:w-auto">
          {authenticated ? "Add Funds" : "Connect to Add Funds"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            {authenticated
              ? "Enter the amount of ETH you want to deposit"
              : "Connect your wallet to deposit funds"}
          </DialogDescription>
        </DialogHeader>

        {authenticated ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (ETH)
              </label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                disabled={isProcessing}
              />
            </div>

            <div className="bg-muted rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">
                  {currentBalanceNum.toFixed(3)} ETH
                </span>
              </div>
              {depositAmount && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">New Balance:</span>
                  <span className="font-medium">
                    {newBalance.toFixed(3)} ETH
                  </span>
                </div>
              )}
              {depositAmount && parseFloat(depositAmount) > 0 && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Gas:</span>
                  <span className="text-xs font-medium">
                    {estimatedGas
                      ? `${Number(finalGas).toLocaleString()} (${Number(estimatedGas).toLocaleString()} + 20%)`
                      : `${Number(finalGas).toLocaleString()} (fallback)`}
                  </span>
                </div>
              )}
            </div>

            {isTransactionPending && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  🔄 Transaction in progress... Please check your wallet.
                </p>
              </div>
            )}

            {depositMutation.isPending && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-800">
                  ✅ Transaction confirmed! Updating your balance...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">
              You need to connect your wallet before making deposits.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDepositClick}
            disabled={
              authenticated &&
              (!depositAmount || parseFloat(depositAmount) <= 0 || isProcessing)
            }
          >
            {!authenticated
              ? "Connect Wallet"
              : isTransactionPending
                ? "Confirming Transaction..."
                : depositMutation.isPending
                  ? "Updating Balance..."
                  : "Deposit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
