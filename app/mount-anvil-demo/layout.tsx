'use client'

import { MountAnvilDemoProvider } from '@/contexts/MountAnvilDemoContext'

export default function MountAnvilDemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MountAnvilDemoProvider>
      {children}
    </MountAnvilDemoProvider>
  )
}
