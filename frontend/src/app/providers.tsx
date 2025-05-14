'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { arbitrum, mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'

const queryClient = new QueryClient()

const config = createConfig({
  chains: [mainnet, arbitrum, sepolia],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
})

// ⚠️ Reemplaza esto con tu App ID real
const PRIVY_APP_ID = 'cmamx0y2z02iel40m69eifs0u'

export function Providers({ children }: PropsWithChildren) {
  return (
    <PrivyProvider appId={PRIVY_APP_ID}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  )
}
