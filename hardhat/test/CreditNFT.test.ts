import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-chai-matchers";

describe("CreditNFT", function () {
  // Use 'any' for contract instances as specific types are unavailable/incorrect path
  // This is a workaround; ideally, TypeChain setup should be fixed.
  let MockUSDCFactory: ContractFactory;
  let CreditNFTFactory: ContractFactory;
  let mockUSDC: any; // Use any as workaround
  let creditNFT: any; // Use any as workaround
  let deployer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // amounts with 6 decimals
  const initialMint = ethers.parseUnits("1000000", 6);
  const stakeReq = ethers.parseUnits("500", 6);
  const baseLimit = ethers.parseUnits("1000", 6);

  async function deployContractsFixture() {
    [deployer, user1, user2] = await ethers.getSigners();

    MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    // Remove cast to specific type
    mockUSDC = await MockUSDCFactory.deploy(initialMint);
    await mockUSDC.waitForDeployment();

    CreditNFTFactory = await ethers.getContractFactory("CreditNFT");
    // Remove cast to specific type
    creditNFT = await CreditNFTFactory.deploy(await mockUSDC.getAddress());
    await creditNFT.waitForDeployment();

    await mockUSDC.transfer(user1.address, ethers.parseUnits("10000", 6));
    await mockUSDC.transfer(user2.address, ethers.parseUnits("10000", 6));

    await mockUSDC
      .connect(user1)
      .approve(await creditNFT.getAddress(), ethers.MaxUint256);
    await mockUSDC
      .connect(user2)
      .approve(await creditNFT.getAddress(), ethers.MaxUint256);

    return { mockUSDC, creditNFT, deployer, user1, user2 };
  }

  beforeEach(async function () {
    ({ mockUSDC, creditNFT, deployer, user1, user2 } = await loadFixture(
      deployContractsFixture
    ));
  });

  it("deploys with correct parameters", async function () {
    expect(await creditNFT.baseCreditLimit()).to.equal(baseLimit);
    expect(await creditNFT.stakingRequirement()).to.equal(stakeReq);
  });

  describe("Minting & Staking", function () {
    it("allows user to stake and mint NFT", async function () {
      await creditNFT.connect(user1).stakeAndMint();
      expect(await creditNFT.balanceOf(user1.address)).to.equal(1);
      expect(await mockUSDC.balanceOf(await creditNFT.getAddress())).to.equal(
        stakeReq
      );
      expect(await creditNFT.stakedAmount(user1.address)).to.equal(stakeReq);
    });

    it("prevents double staking by same address", async function () {
      await creditNFT.connect(user1).stakeAndMint();
      // revertedWith should work now with the import
      await expect(creditNFT.connect(user1).stakeAndMint()).to.be.revertedWith(
        "Already staked"
      );
    });
  });

  describe("Credit Operations", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      const tx = await creditNFT.connect(user1).stakeAndMint();
      const receipt = await tx.wait();
      const transferEvent = receipt?.logs?.find(
        (log: any) =>
          log.eventName === "Transfer" && log.args?.from === ethers.ZeroAddress
      );
      if (!transferEvent || !transferEvent.args)
        throw new Error(
          "Transfer event not found or args missing in mint operation"
        );
      tokenId = transferEvent.args.tokenId;
    });

    it("allows drawing credit up to the limit", async function () {
      const drawAmt = ethers.parseUnits("200", 6);
      const initialBalance = await mockUSDC.balanceOf(user1.address);
      await creditNFT.connect(user1).drawCredit(tokenId, drawAmt);
      expect(await mockUSDC.balanceOf(user1.address)).to.equal(
        initialBalance + drawAmt
      );
      const data = await creditNFT.getCreditData(tokenId);
      expect(data.usedCredit).to.equal(drawAmt);
    });

    it("prevents drawing more than the credit limit", async function () {
      const overdraw = baseLimit + 1n;
      await expect(
        creditNFT.connect(user1).drawCredit(tokenId, overdraw)
      ).to.be.revertedWith("Exceeds credit limit");
    });

    it("allows partial repayment and increases credit score", async function () {
      const drawAmt = ethers.parseUnits("200", 6);
      await creditNFT.connect(user1).drawCredit(tokenId, drawAmt);
      const repayAmt = ethers.parseUnits("150", 6);
      await mockUSDC
        .connect(user1)
        .approve(await creditNFT.getAddress(), repayAmt);
      await creditNFT.connect(user1).repayCredit(tokenId, repayAmt);
      const data = await creditNFT.getCreditData(tokenId);
      expect(data.usedCredit).to.equal(drawAmt - repayAmt);
      expect(data.creditScore).to.be.gt(700);
    });

    it("prevents repaying more than owed", async function () {
      const drawAmt = ethers.parseUnits("50", 6);
      await creditNFT.connect(user1).drawCredit(tokenId, drawAmt);
      const repayTooMuch = drawAmt + 1n;
      await mockUSDC
        .connect(user1)
        .approve(await creditNFT.getAddress(), repayTooMuch);
      await expect(
        creditNFT.connect(user1).repayCredit(tokenId, repayTooMuch)
      ).to.be.revertedWith("Repay too much");
    });

    it("applies interest and penalty after billing cycle reset", async function () {
      const drawAmt = ethers.parseUnits("100", 6);
      await creditNFT.connect(user1).drawCredit(tokenId, drawAmt);
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 3600]);
      await ethers.provider.send("evm_mine");
      await creditNFT.connect(user1).drawCredit(tokenId, 0);
      const data = await creditNFT.getCreditData(tokenId);
      // Ensure interestRate is treated as bigint
      const interestRate: bigint = await creditNFT.interestRate();
      // Use BigInt literal 100n for division
      const expectedInterest = (drawAmt * interestRate) / 100n;
      expect(data.usedCredit).to.equal(drawAmt + expectedInterest);
      const penalty: bigint = await creditNFT.latePaymentPenalty();
      expect(data.creditScore).to.equal(700n - penalty);
    });
  });

  describe("Access Control & Admin Functions", function () {
    it("only owner can set interest rate", async function () {
      await expect(creditNFT.connect(user1).setInterestRate(10))
        .to.be.revertedWithCustomError(creditNFT, "OwnableUnauthorizedAccount")
        .withArgs(user1.address);

    });

    it("owner can update interest rate", async function () {
      await creditNFT.connect(deployer).setInterestRate(10);
      expect(await creditNFT.interestRate()).to.equal(10);
    });

    it("owner can update late payment penalty", async function () {
      await creditNFT.connect(deployer).setLatePaymentPenalty(100);
      expect(await creditNFT.latePaymentPenalty()).to.equal(100);
    });
  });
});
