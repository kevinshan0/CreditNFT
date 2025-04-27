"use client";

import React from "react";
import { WalletProvider } from "./WalletProvider";
import { CreditCardLayout } from "./CreditCardLayout";

export function CreditCardWithProvider() {
  return (
    <WalletProvider>
      <CreditCardLayout />
    </WalletProvider>
  );
}
