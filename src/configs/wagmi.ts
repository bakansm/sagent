import { createConfig, http } from "wagmi";
import { sagentChain } from "./chain";

export const config = createConfig({
  chains: [sagentChain],
  transports: {
    [sagentChain.id]: http(),
  },
});
