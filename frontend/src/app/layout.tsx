// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Xescrow',
  description: 'Tu Escrow Laboral Web3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="bottom-right" />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
