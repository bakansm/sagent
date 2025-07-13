"use client";

import { env } from "@/env";
import { PrivyProvider } from "@privy-io/react-auth";
import { lisk, saga } from "viem/chains";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={env.NEXT_PUBLIC_PRIVY_APP_ID}
      clientId={env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
      config={{
        defaultChain: saga,
        supportedChains: [lisk, saga],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
