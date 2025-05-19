import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

dotenvConfig();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    mantleSepolia: {
      url: process.env.MANTLE_SEPOLIA_RPC || "https://rpc.sepolia.mantle.xyz",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
  },
  etherscan: {
    apiKey: process.env.MANTLE_API_KEY,
    customChains: [{
      network: "mantleSepolia",
      chainId: 5003,
      urls: {
        apiURL: 'https://api-sepolia.mantlescan.xyz/api',
        browserURL: 'https://sepolia.mantlescan.xyz/'
      }
    }],
  },
  sourcify: {
    enabled: true,
  },
};

export default config;