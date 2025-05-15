'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'
import {
  useAccount,
  useConnect,
  useWriteContract,
  useChainId,
  useSwitchChain,
} from 'wagmi'
import { injected } from 'wagmi/connectors'
import { contractAddress, contractAbi } from '@/lib/contract'
import toast from 'react-hot-toast'

export default function Home() {
  const { login, logout, authenticated } = usePrivy()
  const [loadingRole, setLoadingRole] = useState<1 | 2 | null>(null)

  const { isConnected } = useAccount()
  const { connect } = useConnect()
  const { writeContractAsync } = useWriteContract()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const chainName = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia',
    42161: 'Arbitrum',
    421614: 'Arbitrum Sepolia',
  }[chainId] ?? 'Desconocido'

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
    } catch (err: any) {
      console.error(err)

      if (
        err?.shortMessage?.includes('User rejected') ||
        err?.message?.includes('user rejected') ||
        err?.message?.includes('User rejected the request') ||
        err?.code === 4001
      ) {
        toast("Transacción cancelada por el usuario ❌", { icon: '❌' })
      } else if (err?.name === 'ConnectorNotConnectedError') {
        toast.error("Tu wallet no está conectada.")
      } else if (err?.message?.includes('insufficient funds')) {
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

      {chainId !== 421614 && (
        <Button
          variant="outline"
          onClick={() => switchChain({ chainId: 421614 })}
          className="mt-2 text-black border-white hover:bg-white hover:text-black"
        >
          Cambiar a Arbitrum Sepolia
        </Button>
      )}

      {authenticated && (
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
