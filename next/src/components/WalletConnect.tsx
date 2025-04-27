import { useAccount, useConnect, useEnsName, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export function WalletConnect() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  const handleClick = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      // Use first available connector (typically MetaMask)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  }, [isConnected, connect, connectors, disconnect]);

  // Format address for display (truncate)
  const truncatedAddress = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : "";

  return (
    <Button
      onClick={handleClick}
      variant={isConnected ? "outline" : "default"}
      className="font-medium"
    >
      {isConnected ? (
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          {ensName || truncatedAddress}
        </span>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  );
}
