'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ role }: { role: 'cliente' | 'proveedor' }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Bienvenido {role.charAt(0).toUpperCase() + role.slice(1)}</h1>
      {/* Aquí iría el dashboard específico del rol */}
      <p className="text-lg">Contenido del dashboard para {role}</p>
    </div>
  );
}