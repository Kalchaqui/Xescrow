'use client'

import { useParams } from 'next/navigation'
import { useReadContract } from 'wagmi'
import { contractAddress, contractAbi } from '@/lib/contract'

const statusMap = ['Abierta', 'Aceptada', 'Completada', 'En disputa', 'Cancelada']

export default function OfferDetailPage() {
  const params = useParams()
  const id = params?.id ? BigInt(params.id as string) : undefined

  const { data: offer, isLoading } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offers',
    args: [id],
  }) as {
    data:
      | {
          id: bigint
          provider: string
          client: string
          price: bigint
          descriptionHash: string
          status: number
        }
      | undefined
    isLoading: boolean
  }

  if (!id) {
    return <div className="p-8 text-white bg-gray-900">ID de oferta inválido.</div>
  }

  if (isLoading) {
    return <div className="p-8 text-white bg-gray-900">Cargando oferta #{id.toString()}...</div>
  }

  if (!offer) {
    return <div className="p-8 text-white bg-gray-900">Oferta no encontrada.</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Oferta #{offer.id.toString()}</h1>
      <p className="mb-2"><strong>Proveedor:</strong> {offer.provider}</p>
      <p className="mb-2"><strong>Cliente:</strong> {offer.client}</p>
      <p className="mb-2"><strong>Descripción:</strong> {offer.descriptionHash}</p>
      <p className="mb-2"><strong>Precio:</strong> {Number(offer.price).toLocaleString()} USDT</p>
      <p className="mb-2"><strong>Estado:</strong> {statusMap[offer.status] ?? 'Desconocido'}</p>
    </div>
  )
}
