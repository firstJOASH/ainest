import { publicProvider } from "@starknet-react/core";
import { mainnet, sepolia } from "@starknet-react/chains";
import { Chain } from "@starknet-react/chains";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

// Contract addresses - Update these with actual deployed contract addresses
export const CONTRACT_ADDRESS =
  "0x02112566c584fdad21d338baf2b839d60b7f04149354293759692f8a31ee6e39";

// Dataset interface matching Cairo contract
export interface Dataset {
  owner: string;
  name: string;
  ipfs_hash: string;
  price: bigint;
  id: bigint;
  category: string;
  originalOwner: string;
  listed: boolean;
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
