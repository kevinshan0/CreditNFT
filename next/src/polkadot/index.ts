// Export all functionality from the polkadot folder
export { creditNFT, CreditData } from "./creditNFT";
export { transactionHandler } from "./transactionHandler";
export { creditManager } from "./creditManager";
export { assetBridge } from "./bridge";

// Helper function to format BN to human-readable format with 6 decimals
export const formatUSDC = (amount: any, decimals: number = 6): string => {
  if (!amount) return "0.00";
  const amountStr = amount.toString();

  if (amountStr.length <= decimals) {
    return "0." + amountStr.padStart(decimals, "0");
  }

  const wholePart = amountStr.slice(0, amountStr.length - decimals);
  const decimalPart = amountStr.slice(amountStr.length - decimals);

  return `${wholePart}.${decimalPart}`;
};

// Helper to convert human-readable format to BN
export const parseUSDC = (amount: string, decimals: number = 6): any => {
  if (!amount || isNaN(Number(amount))) return null;

  const parts = amount.split(".");
  const wholePart = parts[0] || "0";
  let decimalPart = parts[1] || "0";

  // Pad or truncate decimal part to match decimals
  if (decimalPart.length > decimals) {
    decimalPart = decimalPart.slice(0, decimals);
  } else {
    decimalPart = decimalPart.padEnd(decimals, "0");
  }

  const fullValueStr = wholePart + decimalPart;

  // Remove leading zeros
  const trimmedValue = fullValueStr.replace(/^0+/, "") || "0";

  // Use the appropriate library for big numbers based on your imports
  const { BN } = require("@polkadot/util");
  return new BN(trimmedValue);
};
