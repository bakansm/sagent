import { liskSepolia } from "viem/chains";
import { createConfig, http } from "wagmi";
import { sagentTestnet } from "./chain";

export const config = createConfig({
  chains: [sagentTestnet, liskSepolia],
  transports: {
    [sagentTestnet.id]: http(),
    [liskSepolia.id]: http(),
  },
});
