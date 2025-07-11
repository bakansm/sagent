"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { usePrivy } from "@privy-io/react-auth";
import { CopyIcon, LogOutIcon, WalletIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function Navbar() {
  const { authenticated, user, login, logout } = usePrivy();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-transparent bg-transparent p-4 transition-all duration-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link className="flex items-center gap-2" href="/">
          <Image src="/logo.svg" alt="logo" width={24} height={24} />
          <span className="text-lg font-semibold">Sagent</span>
        </Link>
        {authenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <WalletIcon />
                <span className="hidden md:block">
                  {user?.wallet?.address.slice(0, 4)}...
                  {user?.wallet?.address.slice(-4)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    user?.wallet?.address ?? "",
                  );
                  toast.success("Address copied to clipboard");
                }}
              >
                <CopyIcon className="text-muted-foreground" />
                <span className="text-muted-foreground hidden md:block">
                  Copy Address
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOutIcon className="text-red-500" />
                <span className="hidden text-red-500 md:block">Disconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={login}>
            <WalletIcon />
            <span className="hidden md:block">Connect Wallet</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
