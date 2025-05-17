'use client'

import { useEffect, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useReadContract } from 'wagmi'
import { contractAddress, contractAbi } from '@/lib/contract'

type Offer = {
  id: bigint
  provider: string
  client: string
  price: bigint
  descriptionHash: string
  status: number
}

export default function TransactionsPage() {
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address

  const [offers, setOffers] = useState<Offer[]>([])

  const { data: offerCountData } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offerCounter',
  })

  const offerCount = Number(offerCountData ?? 0)

  useEffect(() => {
    const fetchOffers = async () => {
      const calls = Array.from({ length: offerCount }, (_, i) => ({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'offers',
        args: [BigInt(i)],
      }))

      const results = await Promise.allSettled(
        calls.map((call) =>
          fetch('/api/contract-call', {
            method: 'POST',
            body: JSON.stringify(call),
          }).then(res => res.json())
        )
      )

      const validOffers = results
        .filter(r => r.status === 'fulfilled')
        .map((r: any) => r.value) as Offer[]

      const userOffers = validOffers.filter(
        o => o.provider.toLowerCase() === userAddress?.toLowerCase() ||
             o.client.toLowerCase() === userAddress?.toLowerCase()
      )

      setOffers(userOffers)
    }

    if (userAddress && offerCount > 0) {
      fetchOffers()
    }
  }, [userAddress, offerCount])

  const statusMap = ['Abierta', 'Aceptada', 'Completada', 'En disputa', 'Cancelada']

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Historial de transacciones</h1>

      {offers.length === 0 ? (
        <p className="text-gray-500">No tienes transacciones registradas.</p>
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li key={offer.id.toString()} className="bg-gray-800 p-4 rounded shadow">
              <p className="font-semibold">#{offer.id.toString()}</p>
              <p className="text-sm text-gray-300">Proveedor: {offer.provider}</p>
              <p className="text-sm text-gray-300">Cliente: {offer.client}</p>
              <p className="text-sm text-gray-300">Descripción: {offer.descriptionHash}</p>
              <p className="text-sm text-gray-300">Precio: {(Number(offer.price) / 1e6).toLocaleString()} USDT</p>
              <p className="text-sm text-gray-400">Estado: {statusMap[offer.status]}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
