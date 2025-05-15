import { Abi } from 'abitype'
import abi from './abi.json'

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
export const contractAbi = abi as Abi