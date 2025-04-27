import { asset } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { startFromWorker } from "polkadot-api/smoldot/from-node-worker";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

// Constants for USDC Asset
export const USDC_ASSET_ID = 1337; // Replace with actual USDC asset ID on Asset Hub
export const USDC_DECIMALS = 6;

/**
 * Define the type for the asset API
 */
export type AssetApiType = ReturnType<
  typeof createClient
>["getTypedApi"] extends (descriptor: typeof asset) => infer R
  ? R
  : never;

/**
 * Initialize connection to Polkadot Asset Hub
 */
const initializeConnection = async (): Promise<AssetApiType> => {
  try {
    const workerPath = fileURLToPath(
      import.meta.resolve("polkadot-api/smoldot/node-worker")
    );

    const worker = new Worker(workerPath);
    const smoldot = startFromWorker(worker);
    const chain = await smoldot.addChain({ chainSpec });
    const client = createClient(getSmProvider(chain));
    return client.getTypedApi(asset);
  } catch (error: unknown) {
    console.error("Failed to initialize Polkadot Asset Hub connection:", error);
    // Fallback to direct RPC connection if smoldot fails
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to Asset Hub: ${errorMessage}`);
  }
};

// Export the API as a promise that resolves when initialized
export const assetApiPromise = initializeConnection();

// For backward compatibility with existing code
export let assetApi: AssetApiType | undefined;
assetApiPromise
  .then((api) => {
    assetApi = api;
  })
  .catch((error: unknown) => {
    console.error("Failed to initialize asset API:", error);
  });

// Helper function to check if API is ready
export const isAssetApiReady = async (): Promise<boolean> => {
  if (!assetApi) {
    assetApi = await assetApiPromise;
  }
  return !!assetApi;
};
