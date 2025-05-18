'use client'

import { useEffect, useState } from 'react'
import { useWallets } from '@privy-io/react-auth'
import { useReadContract, useReadContracts } from 'wagmi'
import { contractAddress, contractAbi } from '@/lib/contract'

type RawOfferTuple = [
  bigint,   // id
  string,   // provider
  string,   // client
  bigint,   // price
  string,   // descriptionHash
  number    // status (enum)
]

type Offer = {
  id: bigint
  provider: string
  client: string
  price: bigint
  descriptionHash: string
  status: number
}

export default function MyOffersPage() {
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address

  const { data: offerCountData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offerCounter',
  })
  const offerCount = Number(offerCountData ?? 0)

  // Preparamos una llamada por cada índice
  const calls = Array.from({ length: offerCount }, (_, i) => ({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offers',
    args: [BigInt(i)],
  }))

  // Obtenemos las tuplas
  const { data: offersRaw, isLoading: loadingOffers } = useReadContracts({
    contracts: calls,
    allowFailure: false,
  })

  const [offers, setOffers] = useState<Offer[]>([])

  useEffect(() => {
    if (!loadingOffers && offersRaw && userAddress) {
      // Mapear cada tupla a objeto Offer
      const mapped: Offer[] = (offersRaw as RawOfferTuple[]).map(
        ([id, provider, client, price, descriptionHash, status]) => ({
          id,
          provider,
          client,
          price,
          descriptionHash,
          status,
        })
      )

      // Filtrar solo las que corresponden al provider logueado
      const filtered = mapped.filter(
        (o) => o.provider.toLowerCase() === userAddress.toLowerCase()
      )
      setOffers(filtered)
    }
  }, [loadingOffers, offersRaw, userAddress])

  const statusMap = ['Abierta', 'Aceptada', 'Completada', 'En disputa', 'Cancelada']

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Mis ofertas</h1>

      {loadingOffers ? (
        <p className="text-gray-400">Cargando...</p>
      ) : offers.length === 0 ? (
        <p className="text-gray-500">No tienes ofertas registradas.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <li
              key={offer.id.toString()}
              className="border border-white/20 rounded-lg p-4 bg-gray-800 shadow"
            >
              <p className="text-lg font-semibold mb-1">#{offer.id.toString()}</p>
              <p className="text-sm text-gray-300 mb-1">Cliente: {offer.client}</p>
              <p className="text-sm text-gray-300 mb-1">
                Descripción: {offer.descriptionHash}
              </p>
              <p className="text-sm text-gray-300 mb-1">
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
