'use client'

import { useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useReadContract } from 'wagmi'
import { contractAbi, contractAddress } from '@/lib/contract'

type UserData = [number, boolean]

export default function ProviderDashboard() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address
  const router = useRouter()

  const { data: userData, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'users',
    args: [userAddress],
  }) as { data: UserData | undefined; isLoading: boolean }

  const isProvider = userData?.[0] === 2 && userData?.[1] === true

  useEffect(() => {
    if (!isLoading && authenticated && userAddress && !isProvider) {
      router.push('/')
    }
  }, [authenticated, isLoading, isProvider, userAddress, router])

  if (!authenticated || isLoading || !isProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        <p className="text-sm">Cargando dashboard del proveedor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Panel del Proveedor</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-gray-800 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Crear nueva oferta</h2>
          <p className="text-sm text-gray-400 mb-3">Publica un nuevo servicio y empieza a ganar.</p>
          <a href="/create-offer" className="text-green-400 hover:underline text-sm">
            Ir a crear oferta →
          </a>
        </div>

        <div className="p-4 bg-gray-800 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Mis ofertas</h2>
          <p className="text-sm text-gray-400 mb-3">Revisa y gestiona tus servicios activos.</p>
          <a href="/my-offers" className="text-green-400 hover:underline text-sm">
            Ver mis ofertas →
          </a>
        </div>

        <div className="p-4 bg-gray-800 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Retirar fondos</h2>
          <p className="text-sm text-gray-400 mb-3">Consulta tu saldo pendiente y retíralo a tu wallet.</p>
          <a href="/withdraw" className="text-green-400 hover:underline text-sm">
            Ir a retirar →
          </a>
        </div>
      </div>
    </div>
  )
}
