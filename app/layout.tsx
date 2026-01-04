import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Naybourhood - AI-Powered Property Lead Intelligence',
  description: 'Convert more property leads with AI. The intelligent platform for developers, agents, and brokers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
