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
import { parseEther } from 'viem'

type UserData = [number, boolean]

type WagmiError = {
  shortMessage?: string
  code?: number
}

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

      const numericPrice = Number(price)
      if (numericPrice < 0.1) {
        toast.error("El precio mínimo es 0.1 MNT.")
        return
      }
      if (numericPrice > 1000) {
        toast.error("El precio ingresado parece ser demasiado alto. Revisa el monto.")
        return
      }

      const priceInMNT = parseEther(price) // ✅ conversión precisa de MNT a wei

      await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'createServiceOffer',
        args: [description, priceInMNT],
      })

      toast.success("Oferta creada con éxito ✅")
      setDescription('')
      setPrice('')
    } catch (err: unknown) {
      console.error(err)
      const error = err as WagmiError

      if (error?.shortMessage?.includes('User rejected') || error?.code === 4001) {
        toast("Transacción cancelada por el usuario ❌", { icon: '❌' })
      } else {
        toast.error("Error al crear la oferta")
      }
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
          placeholder="Precio en MNT (ej: 0.1)"
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
