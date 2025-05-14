import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify"; // Importa el plugin de verificación

dotenvConfig(); // Carga variables desde .env

const ARB_SEP_RPC = "https://sepolia-rollup.arbitrum.io/rpc ";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    arbitrumSepolia: {
      url: ARB_SEP_RPC,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    enabled: false
  },
  sourcify: {
    enabled: true,
  },
};

export default config;