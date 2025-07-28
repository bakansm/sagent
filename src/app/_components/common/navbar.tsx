"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import {
  CopyIcon,
  CreditCardIcon,
  Loader2Icon,
  LogOutIcon,
  WalletIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useChainId, useSwitchChain } from "wagmi";
import { Button } from "../ui/button";

export default function Navbar() {
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const chainId = useChainId();

  const embeddedWalletAddress = getEmbeddedConnectedWallet(wallets)?.address;
  const externalWallet = wallets.find(
    (wallet) => wallet.address !== embeddedWalletAddress,
  );

  // Prefer external wallet, but fallback to embedded if that's all we have
  const walletAddress = externalWallet?.address ?? embeddedWalletAddress;

  const { switchChainAsync, chains, isPending } = useSwitchChain();

  const handleSwitchChain = useCallback(
    async (chainId: number) => {
      await switchChainAsync({ chainId });
    },
    [switchChainAsync],
  );

  const chainName = useMemo(() => {
    return chains.find((chain) => chain.id === chainId)?.name;
  }, [chains, chainId]);

  return (
    <nav className="bg-white-30 dark:bg-white-30 fixed top-0 right-0 left-0 z-1 p-4 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link
          className="group flex items-center gap-3 transition-all duration-200 hover:scale-105"
          href="/"
        >
          <div className="relative">
            <div className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-blue-500/20 blur-lg"></div>
            <Image
              src="/logo.svg"
              alt="logo"
              width={32}
              height={32}
              className="relative drop-shadow-lg"
            />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
            Sagent
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"outline"} disabled={isPending}>
                {isPending ? (
                  <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  chainName
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {chains.map((chain) => (
                <DropdownMenuItem
                  key={chain.id}
                  onClick={() => handleSwitchChain(chain.id)}
                >
                  {chain.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {authenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-2 bg-white/50 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/80 dark:bg-gray-900/50 dark:hover:bg-gray-900/80"
                >
                  <WalletIcon className="mr-2 h-4 w-4" />
                  <span className="font-medium">
                    {walletAddress?.slice(0, 6)}...
                    {walletAddress?.slice(-4)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border bg-white/80 shadow-lg backdrop-blur-md dark:bg-gray-900/80"
              >
                <DropdownMenuItem
                  onClick={() => {
                    void navigator.clipboard.writeText(walletAddress ?? "");
                    toast.success("Address copied!");
                  }}
                  className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-blue-500 dark:hover:bg-blue-900"
                >
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/billing"
                    className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-green-500 dark:hover:bg-green-900"
                  >
                    <CreditCardIcon className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-500 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={login}
              className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700"
            >
              <WalletIcon className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
