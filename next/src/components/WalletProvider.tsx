import React from "react";
import {
  WagmiConfig,
  createConfig,
  configureChains,
  createClient,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";

// Add Polkadot Asset Hub chain for our project
const polkadotAssetHub = {
  id: 1000,
  name: "Polkadot Asset Hub",
  network: "polkadot-asset-hub",
  nativeCurrency: {
    name: "Polkadot",
    symbol: "DOT",
    decimals: 10,
  },
  rpcUrls: {
    default: {
      http: ["https://polkadot-asset-hub-rpc.polkadot.io"],
      webSocket: ["wss://polkadot-asset-hub-rpc.polkadot.io"],
    },
    public: {
      http: ["https://polkadot-asset-hub-rpc.polkadot.io"],
      webSocket: ["wss://polkadot-asset-hub-rpc.polkadot.io"],
    },
  },
};

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, polkadotAssetHub],
  [publicProvider()]
);

// You'll need to create an .env file with WalletConnect project ID
// Get one from https://cloud.walletconnect.com
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";

// Set up wagmi config
const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "EasyCoins Credit NFT",
      },
    }),
  ],
});

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>;
}
