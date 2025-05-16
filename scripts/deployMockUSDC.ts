import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔵 Desplegando MockUSDC con cuenta:", deployer.address);

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();

  const deployedAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC desplegado en:", deployedAddress);
}

main().catch((error) => {
  console.error("❌ Error crítico:", error);
  process.exitCode = 1;
});