'use client'

import { useState, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import {
  useAccount,
  useConnect,
  useWriteContract,
  useReadContract,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useRouter } from 'next/navigation'
import { contractAddress, contractAbi } from '@/lib/contract'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ✨ Tipado del struct User del contrato
type UserData = [number, boolean]

export default function CreateOfferPage() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const userAddress = wallets[0]?.address
  const router = useRouter()

  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const { writeContractAsync } = useWriteContract()

  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    data: userData,
    isLoading: loadingUser,
  } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'users',
    args: [userAddress],
  }) as { data: UserData | undefined; isLoading: boolean }

  const isProvider = userData?.[0] === 2 && userData?.[1] === true

  useEffect(() => {
    if (!loadingUser && userAddress && authenticated && !isProvider) {
      toast.error("Solo los proveedores pueden crear ofertas.")
      router.push('/')
    }
  }, [userAddress, userData, loadingUser, authenticated, isProvider, router])

  const handleSubmit = async () => {
    if (!authenticated) {
      toast.error("Debes iniciar sesión para crear una oferta.")
      return
    }

    if (!description || !price) {
      toast.error("Completa todos los campos.")
      return
    }

    try {
      setLoading(true)

      if (!isConnected) {
        await connect({ connector: injected() })
      }

      const priceInTokens = BigInt(Number(price) * 1e6)

      await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'createServiceOffer',
        args: [description, priceInTokens],
      })

      toast.success("Oferta creada con éxito ✅")
      setDescription('')
      setPrice('')
    } catch (err: any) {
      console.error(err)
      if (
        err?.shortMessage?.includes('User rejected') ||
        err?.code === 4001
      ) {
        toast("Transacción cancelada por el usuario ❌", { icon: '❌' })
      } else {
        toast.error("Error al crear la oferta")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated || loadingUser || !isProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        <p className="text-sm">Verificando permisos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Crear nueva oferta</h1>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <Input
          placeholder="Descripción del servicio"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Input
          placeholder="Precio en USDT (ej: 10)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? "Creando..." : "Crear Oferta"}
        </Button>
      </div>
    </div>
  )
}
