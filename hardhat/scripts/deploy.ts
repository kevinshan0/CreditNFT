import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy CreditNFT
  const CreditNFT = await ethers.getContractFactory("CreditNFT");
  const creditNFT = await CreditNFT.deploy(
    "0xFFfffffF7D2B0B761Af01Ca8e25242976ac0aD7D"
  );
  await creditNFT.waitForDeployment();
  console.log("CreditNFT deployed at:", await creditNFT.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});