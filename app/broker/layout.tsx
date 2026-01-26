'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

function BrokerLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle auth callback URL params (from fresh login)
  useEffect(() => {
    if (searchParams.get('auth') === 'success') {
      const userId = searchParams.get('userId')
      const email = searchParams.get('email')
      const name = searchParams.get('name')
      const role = searchParams.get('role')
      const companyId = searchParams.get('companyId')

      if (userId && email) {
        const userData = {
          id: userId,
          email,
          name: name || email.split('@')[0],
          role: role || 'broker',
          company_id: companyId || undefined,
        }
        localStorage.setItem('naybourhood_user', JSON.stringify(userData))
        window.history.replaceState({}, '', '/broker')
      }
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const currentUser = user || (() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('naybourhood_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  if (!currentUser) {
    router.push('/login')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    )
  }

  return (
    <DataProvider>
      <Toaster position="top-right" richColors closeButton />
      <DashboardLayout
        title={`Welcome back, ${currentUser.name?.split(' ')[0] || 'Broker'}`}
        userType="broker"
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={logout}
      >
        {children}
      </DashboardLayout>
    </DataProvider>
  )
}

function BrokerLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrokerLayoutContent>{children}</BrokerLayoutContent>
    </AuthProvider>
  )
}

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <BrokerLayoutInner>{children}</BrokerLayoutInner>
    </Suspense>
  )
}
