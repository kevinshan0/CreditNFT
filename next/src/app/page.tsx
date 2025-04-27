"use client";

import dynamic from "next/dynamic";

// Use dynamic import to prevent hydration issues with ConnectKit
const CreditCardLayoutWithProvider = dynamic(
  () =>
    import("@/components/CreditCardWithProvider").then(
      (mod) => mod.CreditCardWithProvider
    ),
  { ssr: false }
);

export default function HomePage() {
  return <CreditCardLayoutWithProvider />;
}
