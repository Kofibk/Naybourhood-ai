'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('naybourhood_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function AgentLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localUser, setLocalUser] = useState(getStoredUser)

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
          role: role || 'agent',
          company_id: companyId || undefined,
        }
        localStorage.setItem('naybourhood_user', JSON.stringify(userData))
        setLocalUser(userData)
        window.history.replaceState({}, '', '/agent')
      }
    }
  }, [searchParams])

  const currentUser = user || localUser

  useEffect(() => {
    if (!currentUser && typeof window !== 'undefined') {
      const stored = getStoredUser()
      if (stored) {
        setLocalUser(stored)
      } else {
        router.push('/login')
      }
    }
  }, [currentUser, router])

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <DataProvider>
      <Toaster position="top-right" richColors closeButton />
      <DashboardLayout
        title={`Welcome back, ${currentUser.name?.split(' ')[0] || 'Agent'}`}
        userType="agent"
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={logout}
      >
        {children}
      </DashboardLayout>
    </DataProvider>
  )
}

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AgentLayoutContent>{children}</AgentLayoutContent>
    </AuthProvider>
  )
}

export default function AgentLayout({
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
      <AgentLayoutInner>{children}</AgentLayoutInner>
    </Suspense>
  )
}
