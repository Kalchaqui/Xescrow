import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔵 Desplegando contratos con la cuenta:", deployer.address);

  // 1. Desplegar MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(
  );
  await mockUSDC.waitForDeployment();
    console.log("EXITO")

  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC desplegado en:", mockUSDCAddress);

  // 2. Desplegar Xescrow con MockUSDC
  const Xescrow = await ethers.getContractFactory("Xescrow");
  const xescrow = await Xescrow.deploy(mockUSDCAddress, 
  );
  await xescrow.waitForDeployment();
  const xescrowAddress = await xescrow.getAddress();
  console.log("✅ Xescrow desplegado en:", xescrowAddress);
}

main().catch((error) => {
  console.error("❌ Error crítico:", error);
  process.exitCode = 1;
});