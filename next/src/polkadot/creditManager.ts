import { creditNFT, CreditData } from "./creditNFT";
import { transactionHandler } from "./transactionHandler";
import { BN } from "@polkadot/util";

// Constants
const MIN_CREDIT_SCORE = 300;
const MAX_CREDIT_SCORE = 850;
const CREDIT_LIMIT_MULTIPLIER = 2; // Credit limit = stake amount * multiplier * score factor

export class CreditManager {
  // Calculate credit limit based on stake amount and credit score
  calculateCreditLimit(stakeAmount: BN, creditScore: number): BN {
    // Credit score factor ranges from 0.5 to 1.5 based on score
    const normalizedScore = Math.max(
      MIN_CREDIT_SCORE,
      Math.min(MAX_CREDIT_SCORE, creditScore)
    );
    const scoreFactor =
      0.5 +
      (normalizedScore - MIN_CREDIT_SCORE) /
        (MAX_CREDIT_SCORE - MIN_CREDIT_SCORE);

    // Calculate credit limit
    return stakeAmount
      .mul(new BN(Math.floor(CREDIT_LIMIT_MULTIPLIER * scoreFactor * 100)))
      .div(new BN(100));
  }

  // Get credit summary including current status, limit, used credit, etc.
  async getCreditSummary(address: string): Promise<{
    hasNFT: boolean;
    tokenId: number | null;
    creditData: CreditData | null;
    availableCredit: BN | null;
    usdcBalance: BN;
  }> {
    // Check if address has NFT
    const hasNFT = await creditNFT.hasNFT(address);
    let tokenId = null;
    let creditData = null;
    let availableCredit = null;

    if (hasNFT) {
      tokenId = await creditNFT.getTokenId(address);
      if (tokenId !== null) {
        creditData = await creditNFT.getCreditData(tokenId);
        availableCredit = await creditNFT.getAvailableCredit(tokenId);
      }
    }

    // Get USDC balance
    const usdcBalance = await transactionHandler.getUSDCBalance(address);

    return {
      hasNFT,
      tokenId,
      creditData,
      availableCredit,
      usdcBalance,
    };
  }

  // Calculate payment due date
  getPaymentDueDate(lastReset: number): Date {
    const dueDate = new Date(lastReset);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from last reset
    return dueDate;
  }

  // Calculate minimum payment (10% of outstanding balance)
  calculateMinimumPayment(usedCredit: BN): BN {
    return usedCredit.mul(new BN(10)).div(new BN(100));
  }

  // Check if payment is past due
  isPaymentPastDue(lastReset: number): boolean {
    const now = Date.now();
    const dueDate = this.getPaymentDueDate(lastReset).getTime();
    return now > dueDate;
  }

  // Calculate days until next payment
  daysUntilPaymentDue(lastReset: number): number {
    const now = Date.now();
    const dueDate = this.getPaymentDueDate(lastReset).getTime();
    const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  // Predict new credit score after a payment
  predictNewCreditScore(
    creditScore: number,
    usedCredit: BN,
    paymentAmount: BN
  ): number {
    const halfDebt = usedCredit.div(new BN(2));

    if (paymentAmount.gte(halfDebt)) {
      // Paying half or more of the debt improves score
      return Math.min(MAX_CREDIT_SCORE, creditScore + 5);
    } else if (paymentAmount.gt(new BN(0))) {
      // Small payment has smaller impact
      return Math.min(MAX_CREDIT_SCORE, creditScore + 1);
    } else {
      // No payment slightly decreases score
      return Math.max(MIN_CREDIT_SCORE, creditScore - 2);
    }
  }
}

// Export singleton instance
export const creditManager = new CreditManager();
