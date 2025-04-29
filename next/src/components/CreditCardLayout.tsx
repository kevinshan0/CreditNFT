import React from "react";
import { WalletConnect } from "./WalletConnect";
import { CreditCardDashboard } from "./CreditCardDashboard";

export function CreditCardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg sticky top-0 z-50">
        <div className="container mx-auto py-5 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EasyCoins Credit Card NFT
              </h1>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Your Decentralized Credit Card
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stake USDC, build credit, spend anywhere on Polkadot Asset Hub
            </p>
          </div>

          <div className="transform hover:scale-[1.02] transition-transform duration-300">
            <CreditCardDashboard />
          </div>

          <div className="mt-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: 1,
                  title: "Stake USDC",
                  description:
                    "Stake USDC to mint your Credit NFT and establish your credit line.",
                },
                {
                  step: 2,
                  title: "Use Your Credit",
                  description:
                    "Make payments using your credit line without spending your USDC.",
                },
                {
                  step: 3,
                  title: "Build Credit Score",
                  description:
                    "Repay your balance to build your on-chain credit score and increase your limit.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col items-center text-center group hover:transform hover:scale-105 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                    <span className="text-white text-2xl font-bold">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
                    {item.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg mt-16 py-8 border-t border-gray-100 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} EasyCoins Credit NFT. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
