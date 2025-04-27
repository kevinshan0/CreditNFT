import { assetApi } from "./assetApi";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";
import { BN } from "@polkadot/util";

// Constants
const USDC_ASSET_ID = 1337; // Replace with actual USDC asset ID on Asset Hub
const CREDIT_NFT_COLLECTION_ID = 999; // Replace with actual NFT collection ID
const MONTHLY_RESET_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const INTEREST_RATE = 5; // 5% per cycle
const LATE_PAYMENT_PENALTY = 50; // credit score penalty
const BASE_CREDIT_LIMIT = new BN("1000000000"); // 1000 USDC with 6 decimals
const STAKING_REQUIREMENT = new BN("500000000"); // 500 USDC with 6 decimals

// Types
export interface CreditData {
  owner: string;
  creditLimit: BN;
  usedCredit: BN;
  creditScore: number;
  lastReset: number;
}

// Main CreditNFT class to interact with Polkadot Asset Hub
export class CreditNFT {
  private api: ApiPromise;
  private initialized: boolean = false;

  // Store credit data locally (in a real app, this would come from chain storage)
  private creditDataStore: Map<number, CreditData> = new Map();
  private stakedAmounts: Map<string, BN> = new Map();
  private nextTokenId: number = 1;

  constructor() {
    this.init();
  }

  private async init() {
    // Connect to Asset Hub
    const wsProvider = new WsProvider(
      "wss://polkadot-asset-hub-rpc.polkadot.io"
    );
    this.api = await ApiPromise.create({ provider: wsProvider });
    this.initialized = true;
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error(
        "CreditNFT not initialized. Wait for initialization to complete."
      );
    }
  }

  // Enable browser extension
  async connectWallet() {
    const extensions = await web3Enable("EasyCoins Credit NFT");
    if (extensions.length === 0) {
      throw new Error(
        "No extension found. Please install Polkadot.js extension."
      );
    }

    const accounts = await web3Accounts();
    return accounts.map((acc) => ({
      address: acc.address,
      name: acc.meta.name || "",
    }));
  }

  // Check if address has a credit NFT already
  async hasNFT(address: string): Promise<boolean> {
    this.ensureInitialized();
    return (
      this.stakedAmounts.has(address) &&
      this.stakedAmounts.get(address)!.gt(new BN(0))
    );
  }

  // Get the token ID for an address
  async getTokenId(address: string): Promise<number | null> {
    this.ensureInitialized();

    for (const [tokenId, data] of this.creditDataStore.entries()) {
      if (data.owner === address) {
        return tokenId;
      }
    }
    return null;
  }

  // Get credit data for a token
  async getCreditData(tokenId: number): Promise<CreditData | null> {
    this.ensureInitialized();
    return this.creditDataStore.get(tokenId) || null;
  }

  // Stake USDC and mint an NFT
  async stakeAndMint(address: string): Promise<number> {
    this.ensureInitialized();

    // Check if already staked
    if (await this.hasNFT(address)) {
      throw new Error("Address already has a Credit NFT");
    }

    // First, approve the tokens (this would be done in a separate transaction)
    // Then, transfer the tokens to the escrow (our contract address)
    const injector = await web3FromAddress(address);

    // Transfer USDC to escrow
    const transferExtrinsic = this.api.tx.assets.transfer(
      USDC_ASSET_ID,
      address, // to ourselves for simulation
      STAKING_REQUIREMENT.toString()
    );

    await transferExtrinsic.signAndSend(address, { signer: injector.signer });

    // Record the staking
    this.stakedAmounts.set(address, STAKING_REQUIREMENT);

    // Mint NFT
    const tokenId = this.nextTokenId++;

    // Create credit data
    const creditData: CreditData = {
      owner: address,
      creditLimit: BASE_CREDIT_LIMIT,
      usedCredit: new BN(0),
      creditScore: 700,
      lastReset: Date.now(),
    };

    this.creditDataStore.set(tokenId, creditData);

    return tokenId;
  }

  // Draw credit (USDC) up to available limit
  async drawCredit(
    address: string,
    tokenId: number,
    amount: BN
  ): Promise<boolean> {
    this.ensureInitialized();

    // Check ownership
    const creditData = this.creditDataStore.get(tokenId);
    if (!creditData || creditData.owner !== address) {
      throw new Error("Not the owner of this Credit NFT");
    }

    // Check for reset and apply
    this._maybeResetCredit(tokenId);

    // Check if within credit limit
    const newUsedCredit = creditData.usedCredit.add(amount);
    if (newUsedCredit.gt(creditData.creditLimit)) {
      throw new Error("Exceeds credit limit");
    }

    // Update used credit
    creditData.usedCredit = newUsedCredit;
    this.creditDataStore.set(tokenId, creditData);

    // Transfer USDC to user
    const injector = await web3FromAddress(address);
    const transferExtrinsic = this.api.tx.assets.transfer(
      USDC_ASSET_ID,
      address,
      amount.toString()
    );

    await transferExtrinsic.signAndSend(address, { signer: injector.signer });

    return true;
  }

  // Repay credit
  async repayCredit(
    address: string,
    tokenId: number,
    amount: BN
  ): Promise<boolean> {
    this.ensureInitialized();

    // Check ownership
    const creditData = this.creditDataStore.get(tokenId);
    if (!creditData || creditData.owner !== address) {
      throw new Error("Not the owner of this Credit NFT");
    }

    // Check if repaying too much
    if (amount.gt(creditData.usedCredit)) {
      throw new Error("Repaying more than owed");
    }

    // Transfer USDC from user to escrow
    const injector = await web3FromAddress(address);
    const transferExtrinsic = this.api.tx.assets.transfer(
      USDC_ASSET_ID,
      address, // to ourselves for simulation
      amount.toString()
    );

    await transferExtrinsic.signAndSend(address, { signer: injector.signer });

    // Update credit data
    creditData.usedCredit = creditData.usedCredit.sub(amount);

    // Reward or penalize score based on repayment size
    const halfDebt = creditData.usedCredit.div(new BN(2));
    if (amount.gte(halfDebt)) {
      creditData.creditScore += 5;
    } else {
      creditData.creditScore =
        creditData.creditScore > 2 ? creditData.creditScore - 2 : 0;
    }

    this.creditDataStore.set(tokenId, creditData);

    return true;
  }

  // Apply interest & penalties at each cycle, then reset timestamp
  private _maybeResetCredit(tokenId: number): void {
    const creditData = this.creditDataStore.get(tokenId);
    if (!creditData) return;

    const now = Date.now();
    if (now >= creditData.lastReset + MONTHLY_RESET_PERIOD) {
      if (!creditData.usedCredit.isZero()) {
        // Apply interest on outstanding debt
        const interest = creditData.usedCredit
          .mul(new BN(INTEREST_RATE))
          .div(new BN(100));
        creditData.usedCredit = creditData.usedCredit.add(interest);

        // Penalty on credit score
        creditData.creditScore = Math.max(
          0,
          creditData.creditScore - LATE_PAYMENT_PENALTY
        );
      }

      creditData.lastReset = now;
      this.creditDataStore.set(tokenId, creditData);
    }
  }

  // Get available credit
  async getAvailableCredit(tokenId: number): Promise<BN> {
    this.ensureInitialized();

    const creditData = this.creditDataStore.get(tokenId);
    if (!creditData) {
      throw new Error("Credit NFT not found");
    }

    // Apply any resets/interest first
    this._maybeResetCredit(tokenId);

    // Return available credit
    return creditData.creditLimit.sub(creditData.usedCredit);
  }
}

// Export singleton instance
export const creditNFT = new CreditNFT();
