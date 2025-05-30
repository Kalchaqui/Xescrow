'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'
import {
  useAccount,
  useConnect,
  useWriteContract,
  useChainId,
  useSwitchChain,
  usePublicClient,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { contractAddress, contractAbi } from '@/lib/contract'
import toast from 'react-hot-toast'

export default function Home() {
  const { login, logout, authenticated } = usePrivy()
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { writeContractAsync } = useWriteContract()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()

  const [loadingRole, setLoadingRole] = useState<1 | 2 | null>(null)
  const [registered, setRegistered] = useState<boolean | null>(null)
  const [role, setRole] = useState<number | null>(null)

  const chainName = {
    5000: 'Mantle Mainnet',
    5003: 'Mantle Sepolia Testnet',
  }[chainId] ?? 'Desconocido'

  const fetchUser = useCallback(async () => {
    if (!address || !publicClient) return

    try {
      const data = await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'users',
        args: [address],
      })

      const [roleValue, isRegistered] = data as [number, boolean]

      setRegistered(isRegistered)
      setRole(roleValue)
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }, [address, publicClient])

  useEffect(() => {
    if (authenticated && address) {
      fetchUser()
    }
  }, [authenticated, address, fetchUser])

  const handleRegister = async (role: 1 | 2) => {
    if (!authenticated) {
      toast.error('Debes iniciar sesión primero.')
      return
    }

    try {
      setLoadingRole(role)

      if (!isConnected) {
        await connect({ connector: injected() })
      }

      await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'registerUser',
        args: [role],
      })

      toast.success("Usuario registrado correctamente ✅")
      setRegistered(true)
      setRole(role)
    } catch (err: unknown) {
      console.error(err)

      const error = err as {
        shortMessage?: string
        message?: string
        name?: string
        code?: number
      }

      if (
        error?.shortMessage?.includes('User rejected') ||
        error?.message?.includes('user rejected') ||
        error?.message?.includes('User rejected the request') ||
        error?.code === 4001
      ) {
        toast("Transacción cancelada por el usuario ❌", { icon: '❌' })
      } else if (error?.name === 'ConnectorNotConnectedError') {
        toast.error("Tu wallet no está conectada.")
      } else if (error?.message?.includes('insufficient funds')) {
        toast.error("No tienes ETH suficiente para pagar el gas ⛽")
      } else {
        toast.error("Error al registrarse")
      }
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">Bienvenido a Xescrow</h1>

      <p className="text-sm text-gray-400">
        Red conectada: {chainName}
      </p>

      {chainId !== 5003 && (
        <Button
          variant="outline"
          onClick={() => switchChain({ chainId: 5003 })}
          className="mt-2 text-black border-white hover:bg-white hover:text-black"
        >
          Cambiar a Mantle Sepolia
        </Button>
      )}

      {authenticated && registered && role !== null && (
        <p className="text-sm text-gray-400">
          Tipo de usuario: {role === 1 ? 'CLIENTE' : 'PROVEEDOR'}
        </p>
      )}

      {authenticated && registered === false && (
        <div className="flex gap-4 mt-4">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleRegister(1)}
            disabled={loadingRole === 1}
          >
            {loadingRole === 1 ? "Registrando..." : "CLIENTE"}
          </Button>

          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleRegister(2)}
            disabled={loadingRole === 2}
          >
            {loadingRole === 2 ? "Registrando..." : "PROVEEDOR"}
          </Button>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        {authenticated ? (
          <Button
            variant="outline"
            onClick={logout}
            className="text-black border-white hover:bg-white hover:text-black"
          >
            Cerrar sesión
          </Button>
        ) : (
          <>
            <Button
              className="mr-4 text-black border-white hover:bg-white hover:text-black"
              variant="outline"
              onClick={login}
            >
              Registrarse
            </Button>
            <Button
              variant="outline"
              onClick={login}
              className="text-black border-white hover:bg-white hover:text-black"
            >
              Iniciar sesión
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
