import React from "react";
import { WalletConnect } from "./WalletConnect";
import { CreditCardDashboard } from "./CreditCardDashboard";

export function CreditCardLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                EasyCoins Credit Card NFT
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
              Your Decentralized Credit Card
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Stake USDC, build credit, spend anywhere on Polkadot Asset Hub
            </p>
          </div>

          <CreditCardDashboard />

          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                    1
                  </span>
                </div>
                <h4 className="font-medium mb-2">Stake USDC</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stake USDC to mint your Credit NFT and establish your credit
                  line.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                    2
                  </span>
                </div>
                <h4 className="font-medium mb-2">Use Your Credit</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Make payments using your credit line without spending your
                  USDC.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                    3
                  </span>
                </div>
                <h4 className="font-medium mb-2">Build Credit Score</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Repay your balance to build your on-chain credit score and
                  increase your limit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 mt-12 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} EasyCoins Credit NFT. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
