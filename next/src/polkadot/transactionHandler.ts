import { assetApi } from "./assetApi";
import { creditNFT } from "./creditNFT";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { BN } from "@polkadot/util";

// Constants
const USDC_ASSET_ID = 1337; // Replace with actual USDC asset ID on Asset Hub

export class TransactionHandler {
  private api: ApiPromise;
  private initialized: boolean = false;

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
        "TransactionHandler not initialized. Wait for initialization to complete."
      );
    }
  }

  // Get USDC balance for an address
  async getUSDCBalance(address: string): Promise<BN> {
    this.ensureInitialized();

    const balance = await this.api.query.assets.account(USDC_ASSET_ID, address);
    if (!balance.isEmpty) {
      // @ts-ignore - this is the correct structure but TypeScript doesn't know it
      return new BN(balance.unwrap().balance.toString());
    }
    return new BN(0);
  }

  // Make a payment using the credit card NFT
  async makePayment(
    fromAddress: string,
    toAddress: string,
    amount: BN,
    tokenId: number
  ): Promise<boolean> {
    this.ensureInitialized();

    // First check if the user has an NFT and if it has enough available credit
    const availableCredit = await creditNFT.getAvailableCredit(tokenId);
    if (availableCredit.lt(amount)) {
      throw new Error("Not enough available credit");
    }

    // Draw credit to make the payment
    await creditNFT.drawCredit(fromAddress, tokenId, amount);

    // Send USDC to recipient
    const injector = await web3FromAddress(fromAddress);
    const transferExtrinsic = this.api.tx.assets.transfer(
      USDC_ASSET_ID,
      toAddress,
      amount.toString()
    );

    await transferExtrinsic.signAndSend(fromAddress, {
      signer: injector.signer,
    });

    return true;
  }

  // Transfer USDC directly (not using credit)
  async transferUSDC(
    fromAddress: string,
    toAddress: string,
    amount: BN
  ): Promise<boolean> {
    this.ensureInitialized();

    // Check if user has enough USDC
    const balance = await this.getUSDCBalance(fromAddress);
    if (balance.lt(amount)) {
      throw new Error("Not enough USDC balance");
    }

    // Send USDC to recipient
    const injector = await web3FromAddress(fromAddress);
    const transferExtrinsic = this.api.tx.assets.transfer(
      USDC_ASSET_ID,
      toAddress,
      amount.toString()
    );

    await transferExtrinsic.signAndSend(fromAddress, {
      signer: injector.signer,
    });

    return true;
  }

  // Get transaction history (this would need an indexer in a real app)
  async getTransactionHistory(address: string): Promise<any[]> {
    this.ensureInitialized();

    // In a real app, this would query an indexer or subquery
    // For now, return an empty array
    return [];
  }
}

// Export singleton instance
export const transactionHandler = new TransactionHandler();
