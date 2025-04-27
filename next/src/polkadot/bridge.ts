import { assetApi } from "./assetApi";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { BN } from "@polkadot/util";
import { creditNFT } from "./creditNFT";

// Constants
const USDC_ASSET_ID = 1337; // Replace with actual USDC asset ID on Asset Hub
const PARACHAIN_ID = 1000; // Replace with actual parachain ID

export class AssetBridge {
  private api!: ApiPromise; // Using the definite assignment assertion
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
        "AssetBridge not initialized. Wait for initialization to complete."
      );
    }
  }

  // Transfer USDC to another parachain
  async transferToParachain(
    fromAddress: string,
    destinationAddress: string,
    amount: BN,
    destinationParaId: number = PARACHAIN_ID
  ): Promise<boolean> {
    this.ensureInitialized();

    const injector = await web3FromAddress(fromAddress);

    // Create the XCM transfer extrinsic
    // This is simplified and would need to be adapted to the specific parachain
    const transferXcm = this.api.tx.xTokens.transfer(
      USDC_ASSET_ID,
      amount.toString(),
      {
        V3: {
          parents: 0,
          interior: {
            X2: [
              { Parachain: destinationParaId },
              { AccountId32: { id: destinationAddress, network: "Any" } },
            ],
          },
        },
      },
      "Unlimited"
    );

    await transferXcm.signAndSend(fromAddress, { signer: injector.signer });

    return true;
  }

  // Transfer USDC from Credit NFT to another parachain
  async transferFromCreditToParachain(
    fromAddress: string,
    destinationAddress: string,
    amount: BN,
    tokenId: number,
    destinationParaId: number = PARACHAIN_ID
  ): Promise<boolean> {
    this.ensureInitialized();

    // First check if the user has an NFT and if it has enough available credit
    const availableCredit = await creditNFT.getAvailableCredit(tokenId);
    if (availableCredit.lt(amount)) {
      throw new Error("Not enough available credit");
    }

    // Draw credit for the transfer
    await creditNFT.drawCredit(fromAddress, tokenId, amount);

    // Now bridge the USDC
    return this.transferToParachain(
      fromAddress,
      destinationAddress,
      amount,
      destinationParaId
    );
  }
}

// Export singleton instance
export const assetBridge = new AssetBridge();
