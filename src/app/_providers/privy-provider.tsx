"use client";

import { sagentChain } from "@/contract/chain";
import { config } from "@/contract/wagmi";
import { env } from "@/env";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import AuthHandler from "./auth-handler";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          key={env.NEXT_PUBLIC_PRIVY_APP_ID}
          appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
          clientId={env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
          config={{
            defaultChain: sagentChain,
            supportedChains: [sagentChain],
            appearance: {
              walletChainType: "ethereum-only",
              theme: "dark",
            },
            embeddedWallets: {
              ethereum: {
                createOnLogin: "all-users",
              },
            },
          }}
        >
          <AuthHandler />
          {children}
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
