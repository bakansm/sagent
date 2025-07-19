import { defineChain } from "viem";

export const sagentChain = defineChain({
  id: 2751288990640000,
  name: "Sagent",
  nativeCurrency: {
    name: "Sagent",
    symbol: "SAG",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://sagent-2751288990640000-1.jsonrpc.sagarpc.io"],
      webSocket: ["https://sagent-2751288990640000-1.ws.sagarpc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Sagent Explorer",
      url: "https://sagent-2751288990640000-1.sagaexplorer.io",
    },
  },
});
