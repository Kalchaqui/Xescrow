import abiJson from './abi.json'
import type { Abi } from 'viem'
import type { InterfaceAbi } from 'ethers'

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

// Para wagmi/viem (usa tipos estrictos de abitype)
export const contractAbi = abiJson as Abi

// Para ethers.js (usa formato compatible con ethers.InterfaceAbi)
export const contractAbiEthers = abiJson as unknown as InterfaceAbi
