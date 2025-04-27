import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { BN } from "@polkadot/util";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

import {
  creditNFT,
  creditManager,
  transactionHandler,
  formatUSDC,
  parseUSDC,
} from "@/polkadot";

export function CreditCardDashboard() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [creditData, setCreditData] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch credit information
  const fetchCreditData = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      setError("");

      const summary = await creditManager.getCreditSummary(address);
      setCreditData(summary);
    } catch (err: any) {
      setError(err.message || "Failed to fetch credit data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Stake and mint a new credit NFT
  const handleStakeAndMint = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const tokenId = await creditNFT.stakeAndMint(address);
      setSuccess(`Successfully minted Credit NFT with ID: ${tokenId}`);

      // Refresh data
      await fetchCreditData();
    } catch (err: any) {
      setError(err.message || "Failed to stake and mint");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Make a payment to repay credit
  const handleRepayCredit = async () => {
    if (!isConnected || !address || !creditData?.tokenId) return;
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const parsedAmount = parseUSDC(paymentAmount);
      await creditNFT.repayCredit(address, creditData.tokenId, parsedAmount);

      setSuccess(`Successfully repaid ${paymentAmount} USDC`);
      setPaymentAmount("");

      // Refresh data
      await fetchCreditData();
    } catch (err: any) {
      setError(err.message || "Failed to repay credit");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Spend credit to make a payment
  const handleSpendCredit = async () => {
    if (!isConnected || !address || !creditData?.tokenId) return;
    if (!spendAmount || parseFloat(spendAmount) <= 0) {
      setError("Please enter a valid amount to spend");
      return;
    }
    if (!recipientAddress) {
      setError("Please enter a recipient address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const parsedAmount = parseUSDC(spendAmount);
      await transactionHandler.makePayment(
        address,
        recipientAddress,
        parsedAmount,
        creditData.tokenId
      );

      setSuccess(
        `Successfully sent ${spendAmount} USDC to ${recipientAddress}`
      );
      setSpendAmount("");
      setRecipientAddress("");

      // Refresh data
      await fetchCreditData();
    } catch (err: any) {
      setError(err.message || "Failed to spend credit");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load credit data when address changes
  useEffect(() => {
    if (isConnected && address) {
      fetchCreditData();
    } else {
      setCreditData(null);
    }
  }, [isConnected, address]);

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Credit NFT Card</CardTitle>
          <CardDescription>
            Connect your wallet to access your credit card
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Please connect your wallet to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Credit NFT Card</CardTitle>
          <CardDescription>Loading your credit information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User doesn't have a credit NFT yet
  if (creditData && !creditData.hasNFT) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Get Your Credit NFT Card</CardTitle>
          <CardDescription>
            Stake USDC to mint your credit card NFT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your USDC Balance: {formatUSDC(creditData.usdcBalance)}</p>
          <p className="text-sm text-muted-foreground">
            Staking 500 USDC will allow you to mint a Credit NFT Card that gives
            you a line of credit.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleStakeAndMint}
            disabled={loading}
            className="w-full"
          >
            Stake 500 USDC & Mint Credit NFT
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // User has a credit NFT
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Credit NFT Card</CardTitle>
        <CardDescription>Manage your credit card NFT</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {success}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Credit Limit</span>
            <span className="text-xl font-semibold">
              {creditData?.creditData
                ? formatUSDC(creditData.creditData.creditLimit)
                : "0.00"}{" "}
              USDC
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              Available Credit
            </span>
            <span className="text-xl font-semibold">
              {creditData?.availableCredit
                ? formatUSDC(creditData.availableCredit)
                : "0.00"}{" "}
              USDC
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Used Credit</span>
            <span className="text-xl font-semibold">
              {creditData?.creditData
                ? formatUSDC(creditData.creditData.usedCredit)
                : "0.00"}{" "}
              USDC
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Credit Score</span>
            <span className="text-xl font-semibold">
              {creditData?.creditData ? creditData.creditData.creditScore : "0"}
            </span>
          </div>
        </div>

        <Tabs defaultValue="spend" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="spend" className="flex-1">
              Spend Credit
            </TabsTrigger>
            <TabsTrigger value="repay" className="flex-1">
              Repay Credit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spend" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium mb-1"
                >
                  Amount (USDC)
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="recipient"
                  className="block text-sm font-medium mb-1"
                >
                  Recipient Address
                </label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="5..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSpendCredit}
                disabled={loading || !spendAmount || !recipientAddress}
                className="w-full"
              >
                Send Payment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="repay" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="repayAmount"
                  className="block text-sm font-medium mb-1"
                >
                  Repayment Amount (USDC)
                </label>
                <Input
                  id="repayAmount"
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Your USDC Balance: {formatUSDC(creditData?.usdcBalance)}
              </p>
              <Button
                onClick={handleRepayCredit}
                disabled={loading || !paymentAmount}
                className="w-full"
              >
                Make Payment
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
