'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import { contractAddress, contractAbiEthers } from '@/lib/contract'

export default function WithdrawPage() {
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address?.toLowerCase()

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [pendingAmount, setPendingAmount] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const ethProvider = window.ethereum as ethers.Eip1193Provider
      const provider = new ethers.BrowserProvider(ethProvider)
      provider.getSigner().then(setSigner)
    }
  }, [])

  const fetchPendingAmount = useCallback(async () => {
    if (!signer || !userAddress) return
    try {
      const contract = new ethers.Contract(contractAddress, contractAbiEthers, signer)
      const amount = await contract.pendingWithdrawals(userAddress)
      setPendingAmount(ethers.formatEther(amount))
    } catch (e: unknown) {
      console.error(e)
      setError('No se pudo obtener el saldo pendiente')
    }
  }, [signer, userAddress])

  useEffect(() => {
    fetchPendingAmount()
  }, [fetchPendingAmount])

  const handleWithdraw = async () => {
    if (!signer) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const contract = new ethers.Contract(contractAddress, contractAbiEthers, signer)
      const tx = await contract.withdrawFunds()
      await tx.wait()
      setSuccess('Fondos retirados con éxito.')
      await fetchPendingAmount()
    } catch (e: unknown) {
      console.error(e)
      const err = e as { message?: string }
      setError(err.message ?? 'Error al retirar fondos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Retiro de Fondos</h1>

      {pendingAmount !== null ? (
        <p className="mb-4 text-lg">
          Saldo disponible para retiro: <strong>{pendingAmount} MNT</strong>
        </p>
      ) : (
        <p className="mb-4 text-gray-400">Cargando saldo...</p>
      )}

      <button
        onClick={handleWithdraw}
        disabled={loading || pendingAmount === '0.0'}
        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : 'Retirar fondos'}
      </button>

      {success && <p className="mt-4 text-green-400">{success}</p>}
      {error && <p className="mt-4 text-red-400">Error: {error}</p>}
    </div>
  )
}
