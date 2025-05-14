'use client'
import { Button } from "@/components/ui/button"
import { usePrivy } from '@privy-io/react-auth'

export default function Home() {
  const { login, logout, authenticated } = usePrivy()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">Bienvenido a Xescrow</h1>

      <div className="flex gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700">CLIENTE</Button>
        <Button className="bg-green-600 hover:bg-green-700">PROVEEDOR</Button>
      </div>

      <div className="mt-8">
        {authenticated ? (
          <Button variant="outline" onClick={logout}>Cerrar sesión</Button>
        ) : (
          <>
            <Button className="mr-4" onClick={login}>Registrarse</Button>
            <Button variant="outline" onClick={login}>Iniciar sesión</Button>
          </>
        )}
      </div>
    </main>
  )
}
