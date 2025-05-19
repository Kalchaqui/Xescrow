'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'

export default function Sidebar() {
  const { authenticated } = usePrivy()

  if (!authenticated) return null

  return (
    <aside className="w-64 h-screen bg-gray-950 text-white p-6 border-r border-white/10 hidden md:block">
      <h1 className="text-2xl font-bold mb-8">Xescrow</h1>
      <nav className="space-y-4 text-sm">
        <Link href="/dashboard" className="hover:text-green-400 block">Dashboard</Link>
        <Link href="/create-offer" className="hover:text-green-400 block">Crear oferta</Link>
        <Link href="/my-offers" className="hover:text-green-400 block">Mis ofertas</Link>
        <Link href="/offers" className="hover:text-green-400 block">Todas las ofertas</Link>
        <Link href="/withdraw" className="hover:text-green-400 block">Retirar fondos</Link>
        <Link href="/transactions" className="hover:text-green-400 block">Transacciones</Link>
      </nav>
    </aside>
  )
}
