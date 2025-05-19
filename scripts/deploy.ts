import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔵 Desplegando contratos con la cuenta:", deployer.address);

  // Desplegar Xescrow
  const Xescrow = await ethers.getContractFactory("Xescrow");
  const xescrow = await Xescrow.deploy();
  await xescrow.waitForDeployment();
  const xescrowAddress = await xescrow.getAddress();
  console.log("✅ Xescrow desplegado en:", xescrowAddress);
}

main().catch((error) => {
  console.error("❌ Error crítico:", error);
  process.exitCode = 1;
});