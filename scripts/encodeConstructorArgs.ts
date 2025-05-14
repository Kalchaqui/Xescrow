import { ethers } from "ethers";

async function main() {
  const tokenAddress = "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8";
  const deliveryTimeout = 604800; // 7 días en segundos

  const abiCoder = new ethers.AbiCoder();
  const encoded = abiCoder.encode(["address", "uint256"], [tokenAddress, deliveryTimeout]);

  console.log("Encoded constructor args:", encoded);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});