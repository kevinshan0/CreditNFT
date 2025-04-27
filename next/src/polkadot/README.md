# EasyCoins Credit NFT - Polkadot Integration

This module provides the necessary functionality to use the Credit NFT system with Polkadot's Asset Hub. It allows users to stake USDC, mint credit NFTs, and use their credit for transactions on the Polkadot network.

## Overview

The Credit NFT system enables users to:

1. Stake USDC on the Asset Hub to mint a Credit NFT
2. Use the Credit NFT to spend USDC (like a credit card)
3. Repay borrowed USDC to maintain or improve credit score
4. Track credit score, limits, and usage

## Module Structure

- `assetApi.ts` - Connection to Polkadot Asset Hub
- `bridge.ts` - Handles transfers between Asset Hub and other parachains
- `creditNFT.ts` - Core Credit NFT functionality
- `creditManager.ts` - Manages credit scores and stake amounts
- `transactionHandler.ts` - Handles USDC transactions
- `index.ts` - Exports all functionality

## Installation

```bash
cd next
npm install
```

## Usage

### Initialize Connection and Wallet

```typescript
import { creditNFT } from "../polkadot";

// Connect wallet
const accounts = await creditNFT.connectWallet();
const userAddress = accounts[0].address;
```

### Check Credit Status

```typescript
import { creditManager } from "../polkadot";

// Get credit summary
const summary = await creditManager.getCreditSummary(userAddress);

if (summary.hasNFT) {
  console.log(`Credit Limit: ${formatUSDC(summary.creditData.creditLimit)}`);
  console.log(`Used Credit: ${formatUSDC(summary.creditData.usedCredit)}`);
  console.log(`Available Credit: ${formatUSDC(summary.availableCredit)}`);
  console.log(`Credit Score: ${summary.creditData.creditScore}`);

  // Check payment due date
  const dueDate = creditManager.getPaymentDueDate(summary.creditData.lastReset);
  console.log(`Payment Due: ${dueDate.toLocaleDateString()}`);

  // Calculate minimum payment
  const minPayment = creditManager.calculateMinimumPayment(
    summary.creditData.usedCredit
  );
  console.log(`Minimum Payment: ${formatUSDC(minPayment)}`);
}
```

### Stake and Mint Credit NFT

```typescript
import { creditNFT } from "../polkadot";

// First, ensure user has enough USDC
// Then, stake and mint
const tokenId = await creditNFT.stakeAndMint(userAddress);
console.log(`Minted Credit NFT with ID: ${tokenId}`);
```

### Make a Payment Using Credit

```typescript
import { transactionHandler, parseUSDC } from "../polkadot";

const amount = parseUSDC("100.50"); // 100.50 USDC
const recipientAddress = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";

// Get token ID
const tokenId = await creditNFT.getTokenId(userAddress);

// Make payment
await transactionHandler.makePayment(
  userAddress,
  recipientAddress,
  amount,
  tokenId
);
```

### Repay Credit

```typescript
import { creditNFT, parseUSDC } from "../polkadot";

const amount = parseUSDC("50.00"); // 50.00 USDC
const tokenId = await creditNFT.getTokenId(userAddress);

// Repay credit
await creditNFT.repayCredit(userAddress, tokenId, amount);
```

### Transfer to Another Parachain

```typescript
import { assetBridge, parseUSDC } from "../polkadot";

const amount = parseUSDC("75.00"); // 75.00 USDC
const recipientAddress = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty";
const tokenId = await creditNFT.getTokenId(userAddress);
const moonbeamParaId = 2004; // Moonbeam Parachain ID

// Transfer using credit
await assetBridge.transferFromCreditToParachain(
  userAddress,
  recipientAddress,
  amount,
  tokenId,
  moonbeamParaId
);
```

## Important Notes

1. Remember to replace placeholder IDs with actual values:

   - `USDC_ASSET_ID` - The actual USDC asset ID on Asset Hub
   - `CREDIT_NFT_COLLECTION_ID` - The NFT collection ID for Credit NFTs
   - `PARACHAIN_ID` - Default parachain ID for transfers

2. This implementation is a frontend-only mock and in production should be:
   - Connected to real on-chain storage
   - Secured with proper authorization
   - Tested thoroughly across different networks
