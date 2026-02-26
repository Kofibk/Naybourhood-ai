'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { QueryProvider } from '@/contexts/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { DEMO_USER } from '@/lib/demo-data'
import { Toaster } from 'sonner'

function DemoLayoutContent({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [userName, setUserName] = useState(DEMO_USER.name)
  const router = useRouter()

  useEffect(() => {
    // Ensure demo user is in localStorage
    try {
      const stored = localStorage.getItem('naybourhood_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.isDemo) {
          setUserName(parsed.name || DEMO_USER.name)
          setIsReady(true)
          return
        }
      }
    } catch { /* ignore */ }

    // No demo user found — set one up and continue
    const demoUser = {
      ...DEMO_USER,
      user_type: 'developer',
    }
    localStorage.setItem('naybourhood_user', JSON.stringify(demoUser))
    sessionStorage.setItem('naybourhood_skip_onboarding', 'true')
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('naybourhood_user')
    sessionStorage.removeItem('naybourhood_skip_onboarding')
    router.push('/')
  }

  return (
    <QueryProvider>
      <Toaster position="top-right" richColors closeButton />
      <DashboardLayout
        title={`Welcome back, ${userName.split(' ')[0]}`}
        userType="developer"
        userName={userName}
        userEmail={DEMO_USER.email}
        onLogout={handleLogout}
      >
        {children}
      </DashboardLayout>
    </QueryProvider>
  )
}

export default function DemoDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="animate-pulse text-white/60">Loading presentation mode...</div>
        </div>
      }
    >
      <AuthProvider>
        <DemoLayoutContent>{children}</DemoLayoutContent>
      </AuthProvider>
    </Suspense>
  )
}
