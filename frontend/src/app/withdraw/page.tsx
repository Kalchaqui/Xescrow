'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount, useConnect, useReadContract, useWriteContract } from 'wagmi'
import { contractAddress, contractAbi } from '@/lib/contract'
import { injected } from 'wagmi/connectors'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function WithdrawPage() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address

  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const { writeContractAsync } = useWriteContract()

  const [balance, setBalance] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: pendingAmount, refetch } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'pendingWithdrawals',
    args: [userAddress],
  })

  useEffect(() => {
    if (pendingAmount) {
      setBalance(pendingAmount as bigint)
    }
  }, [pendingAmount])

  const handleWithdraw = async () => {
    try {
      setLoading(true)
      if (!isConnected) {
        await connect({ connector: injected() })
      }

      await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'withdrawFunds',
        args: [],
      })

      toast.success("Fondos retirados correctamente ✅")
      await refetch()
    } catch (err: any) {
      console.error(err)
      toast.error("Error al retirar fondos")
    } finally {
      setLoading(false)
    }
  }

  const formatted = balance ? (Number(balance) / 1e6).toLocaleString() : '0.00'

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-6">Retirar fondos</h1>

      <p className="text-lg mb-4">Tienes <span className="text-green-400 font-semibold">{formatted} USDT</span> disponibles.</p>

      <Button
        onClick={handleWithdraw}
        disabled={loading || balance === null || balance === 0n}
        className="bg-green-600 hover:bg-green-700"
      >
        {loading ? "Retirando..." : "Retirar fondos"}
      </Button>
    </div>
  )
}
