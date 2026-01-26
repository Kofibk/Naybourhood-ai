'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

function DeveloperLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('naybourhood_user')
      if (!stored) {
        router.push('/login')
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Redirecting...</div>
          </div>
        )
      }
    }
  }

  const currentUser = user || (() => {
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
        title={`Welcome back, ${currentUser.name?.split(' ')[0] || 'Developer'}`}
        userType="developer"
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={logout}
      >
        {children}
      </DashboardLayout>
    </DataProvider>
  )
}

function DeveloperLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DeveloperLayoutContent>{children}</DeveloperLayoutContent>
    </AuthProvider>
  )
}

export default function DeveloperLayout({
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
      <DeveloperLayoutInner>{children}</DeveloperLayoutInner>
    </Suspense>
  )
}
