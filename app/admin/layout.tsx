'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

// Get user from localStorage synchronously (for instant render)
function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('naybourhood_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localUser, setLocalUser] = useState(getStoredUser)

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
          role: role || 'admin',
          company_id: companyId || undefined,
        }
        localStorage.setItem('naybourhood_user', JSON.stringify(userData))
        setLocalUser(userData)
        window.history.replaceState({}, '', '/admin')
      }
    }
  }, [searchParams])

  // Use AuthContext user if available, otherwise localStorage user
  const currentUser = user || localUser

  // No user anywhere - redirect to login
  useEffect(() => {
    if (!currentUser && typeof window !== 'undefined') {
      // Double-check localStorage one more time
      const stored = getStoredUser()
      if (stored) {
        setLocalUser(stored)
      } else {
        router.push('/login')
      }
    }
  }, [currentUser, router])

  // Always render the dashboard shell - never block on loading
  // If no user yet, show minimal shell while checking
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
        title={`Welcome back, ${currentUser.name?.split(' ')[0] || 'Admin'}`}
        userType="admin"
        userName={currentUser.name}
        userEmail={currentUser.email}
        onLogout={logout}
      >
        {children}
      </DashboardLayout>
    </DataProvider>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  )
}

export default function AdminLayout({
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
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  )
}
