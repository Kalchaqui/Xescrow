'use client'

import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import { contractAddress, contractAbi } from '@/lib/contract'

type RawOfferTuple = [bigint, string, string, bigint, string, number]
type Offer = {
  id: bigint
  provider: string
  client: string
  price: bigint
  descriptionHash: string
  status: number
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function OffersPage() {
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address?.toLowerCase()

  // Obtener signer directamente de window.ethereum
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      provider.getSigner().then((s: any) => setSigner(s))
    }
  }, [])

  const [offers, setOffers] = useState<Offer[]>([])
  const [acceptingId, setAcceptingId] = useState<bigint | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 1. Leer cuántas ofertas hay
  const { data: offerCountData, isLoading: loadingCount } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'offerCounter',
  })
  const offerCount = Number(offerCountData ?? 0)

  // 2. Preparar llamadas a offers(i)
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

  // 3. Mapear tuplas a objetos Offer
  useEffect(() => {
    if (!loadingOffers && offersRaw) {
      const mapped = (offersRaw as RawOfferTuple[]).map(
        ([id, provider, client, price, descriptionHash, status]) => ({
          id,
          provider,
          client,
          price,
          descriptionHash,
          status,
        })
      )
      setOffers(mapped)
    }
  }, [loadingOffers, offersRaw])

  const statusMap = ['Abierta', 'Aceptada', 'Completada', 'En disputa', 'Cancelada']

  // 4. Handler para aceptar oferta
  const handleAccept = async (offer: Offer) => {
    if (!signer || !userAddress) {
      setError('Conecta tu wallet primero.')
      return
    }
    setError(null)
    setAcceptingId(offer.id)

    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractAbi as any,
        signer
      )

      // calcular fee 2% y total
      const fee = (offer.price * 2n) / 100n
      const total = offer.price + fee

      const tx = await contract.acceptOffer(offer.id, { value: total })
      await tx.wait()

      // actualizar estado localmente
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offer.id
            ? { ...o, status: 1, client: userAddress }
            : o
        )
      )
    } catch (e: any) {
      console.error(e)
      setError(e.message ?? 'Error al aceptar oferta')
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Ofertas disponibles</h1>

      {(loadingCount || loadingOffers) && <p>Cargando ofertas...</p>}

      {!loadingCount && !loadingOffers && offers.length === 0 && (
        <p>No hay ofertas por ahora.</p>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer) => {
          const isProvider = offer.provider.toLowerCase() === userAddress
          const isClient = offer.client === ZERO_ADDRESS && !isProvider

          return (
            <li
              key={offer.id.toString()}
              className="flex flex-col border p-4 rounded bg-gray-800 shadow h-full"
            >
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  Oferta #{offer.id.toString()}
                </p>
                <p className="text-sm text-gray-300">
                  Proveedor: {offer.provider}
                </p>
                <p className="text-sm text-gray-300">
                  Descripción: {offer.descriptionHash}
                </p>
                <p className="text-sm text-gray-300">
                  Precio:{' '}
                  {(Number(offer.price) / 1e18).toLocaleString()} MNT
                </p>
                <p className="text-sm text-gray-400">
                  Estado: {statusMap[offer.status] ?? 'Desconocido'}
                </p>
              </div>

              {isClient && (
                <button
                  onClick={() => handleAccept(offer)}
                  disabled={acceptingId === offer.id}
                  className="mt-auto self-end px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {acceptingId === offer.id
                    ? 'Procesando...'
                    : 'Aceptar oferta'}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {error && <p className="mt-4 text-red-400">Error: {error}</p>}
    </div>
  )
}
