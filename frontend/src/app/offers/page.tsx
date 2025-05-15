'use client'

import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { contractAddress, contractAbi } from '@/lib/contract'
import toast from 'react-hot-toast'

type Offer = {
  id: bigint
  provider: string
  client: string
  price: bigint
  descriptionHash: string
  status: number
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)

  const { data: offerCountData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offerCounter',
  })

  const offerCount = Number(offerCountData ?? 0)

  // Arma las llamadas
  const calls = Array.from({ length: offerCount }, (_, i) => ({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offers',
    args: [BigInt(i)],
  }))

  const { data: offersRaw, isLoading: loadingOffers } = useReadContracts({
    contracts: calls,
    allowFailure: false,
  })

  useEffect(() => {
    if (offersRaw) {
      setOffers(offersRaw as Offer[])
    }
  }, [offersRaw])

  const statusMap = ['Abierta', 'Aceptada', 'Completada', 'En disputa', 'Cancelada']

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Ofertas disponibles</h1>

      {loadingOffers ? (
        <p className="text-gray-400">Cargando ofertas...</p>
      ) : offers.length === 0 ? (
        <p className="text-gray-500">No hay ofertas por ahora.</p>
      ) : (
        <ul className="space-y-4">
          {offers.map((offer, i) => (
            <li key={i} className="border border-white/20 rounded-lg p-4">
              <p className="text-lg font-semibold">#{offer.id.toString()}</p>
              <p className="text-sm text-gray-300">Proveedor: {offer.provider}</p>
              <p className="text-sm text-gray-300">Descripción: {offer.descriptionHash}</p>
              <p className="text-sm text-gray-300">
                Precio: {(Number(offer.price) / 1e6).toLocaleString()} USDT
              </p>
              <p className="text-sm text-gray-400">
                Estado: {statusMap[offer.status] ?? 'Desconocido'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
