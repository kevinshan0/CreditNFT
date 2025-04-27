import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MockUSDC first
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(ethers.parseUnits("1000000", 6)); // 1M USDC
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed at:", await mockUSDC.getAddress());

  // Deploy CreditNFT
  const CreditNFT = await ethers.getContractFactory("CreditNFT");
  const creditNFT = await CreditNFT.deploy(await mockUSDC.getAddress());
  await creditNFT.waitForDeployment();
  console.log("CreditNFT deployed at:", await creditNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});