import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando contratos con la cuenta:", deployer.address);

  const USDC_TOKEN_ADDRESS = "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8"; // ✅ Checksum correcto
  const DELIVERY_TIMEOUT = 7 * 24 * 60 * 60; // 7 días

  const Xescrow = await ethers.getContractFactory("Xescrow");
  const xescrow = await Xescrow.deploy(USDC_TOKEN_ADDRESS, DELIVERY_TIMEOUT);

  await xescrow.waitForDeployment();
  const address = await xescrow.getAddress();
  console.log("Contrato Xescrow desplegado en:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});