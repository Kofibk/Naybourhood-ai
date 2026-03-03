'use client'

import { Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { GcpSidebar } from '@/components/gcpdemo/GcpSidebar'
import { GcpDemoAIChat } from '@/components/gcpdemo/GcpDemoAIChat'
import { Toaster } from 'sonner'

function GcpLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    router.push('/')
  }

  // Page title based on route
  const getTitle = () => {
    if (pathname.includes('/building')) return 'London Kensington Serviced Apartments'
    if (pathname.includes('/enquirers')) return 'Enquirers'
    if (pathname.includes('/conversations')) return 'AI Conversations'
    if (pathname.includes('/insights')) return 'Insights & Outcomes'
    if (pathname.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <GcpSidebar onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-[#171717] border-b border-white/10 px-4 py-4 lg:px-6 flex items-center gap-4 flex-shrink-0">
          <div className="lg:hidden w-10" />
          <h1 className="text-lg font-medium text-white flex-1 truncate tracking-tight">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wider uppercase text-emerald-400/70 bg-emerald-400/10 px-2.5 py-1 rounded-full">
              Enterprise
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-6 bg-[#0A0A0A]">
          {children}
        </div>
      </main>
      <GcpDemoAIChat />
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}

export default function GcpDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      }
    >
      <GcpLayoutContent>{children}</GcpLayoutContent>
    </Suspense>
  )
}
