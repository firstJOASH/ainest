import { publicProvider } from "@starknet-react/core";
import { mainnet, sepolia } from "@starknet-react/chains";
import { Chain } from "@starknet-react/chains";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

// Contract addresses - Update these with actual deployed contract addresses
export const CONTRACT_ADDRESS =
  "0x044329da1943e0d64edf27b1d165d3eac656f775fdea4118ccc1e08a35099471";

// Dataset interface matching Cairo contract
export interface Dataset {
  owner: string;
  name: string;
  ipfs_hash: string;
  price: bigint;
  id: bigint;
  category: string;
}

export interface UserStats {
  uploads: number;
  downloads: number;
  address: string;
}

// Available connectors
export const connectors = [
  new InjectedConnector({
    options: { id: "argentX", name: "Ready Wallet (formerly Argent)" },
  }),
  new InjectedConnector({
    options: { id: "braavos", name: "Braavos" },
  }),
  new InjectedConnector({ options: { id: "metamask", name: "MetaMask" } }),
  new WebWalletConnector({ url: "https://web.argent.xyz" }),
];

// Chains configuration
export const chains: Chain[] = [mainnet, sepolia];

// Provider configuration
export const provider = publicProvider();

// Dataset categories
export const DATASET_CATEGORIES = [
  "Computer Vision",
  "Natural Language Processing",
  "Audio Processing",
  "Time Series",
  "Reinforcement Learning",
  "Medical Data",
  "Financial Data",
  "IoT Sensor Data",
  "Social Media",
  "Other",
] as const;

export type DatasetCategory = (typeof DATASET_CATEGORIES)[number];
