import { defineChain } from "viem";

export const sagentTestnet = defineChain({
  id: 2751288990640000,
  name: "Sagent Testnet",
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

export const liskSepolia = defineChain({
  id: 4202,
  name: "Lisk Sepolia Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.sepolia-api.lisk.com"],
      webSocket: ["wss://rpc.sepolia-api.lisk.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Lisk Sepolia Explorer",
      url: "https://sepolia-blockscout.lisk.com",
    },
  },
});
