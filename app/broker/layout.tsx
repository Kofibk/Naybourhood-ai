'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { QueryProvider } from '@/contexts/QueryProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isMasterAdmin, canAccessDashboard } from '@/lib/auth'
import { Toaster } from 'sonner'

function BrokerLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyAccess = async () => {
      // Check if coming from auth callback with URL params
      const authSuccess = searchParams.get('auth') === 'success'
      if (authSuccess) {
        const userId = searchParams.get('userId')
        const email = searchParams.get('email')
        const name = searchParams.get('name')
        const role = searchParams.get('role')
        const companyId = searchParams.get('companyId')

        if (userId && email && role) {
          // Verify role allows broker access
          if (!canAccessDashboard(role, 'broker') && !isMasterAdmin(email)) {
            console.warn('[Broker Layout] Access denied - user role:', role)
            router.push('/login')
            return
          }

          // Save to localStorage for AuthContext to pick up
          const userData = {
            id: userId,
            email,
            name: name || email.split('@')[0],
            role,
            company_id: companyId || undefined,
            is_master_admin: isMasterAdmin(email),
          }
          localStorage.setItem('naybourhood_user', JSON.stringify(userData))
          // Clear URL params
          window.history.replaceState({}, '', '/broker')
          setIsVerifying(false)
          return
        }
      }

      // Wait for AuthContext to load
      if (isLoading) {
        return
      }

      // No user from AuthContext - check localStorage as fallback
      if (!user) {
        const stored = localStorage.getItem('naybourhood_user')
        if (!stored) {
          router.push('/login')
          return
        }

        try {
          const parsed = JSON.parse(stored)
          // Validate user has broker access
          if (!canAccessDashboard(parsed.role, 'broker') && !isMasterAdmin(parsed.email)) {
            console.warn('[Broker Layout] Access denied - user role:', parsed.role)
            router.push('/login')
            return
          }
        } catch {
          router.push('/login')
          return
        }
      } else {
        // User exists from AuthContext - verify they have broker access
        if (!canAccessDashboard(user.role, 'broker') && !isMasterAdmin(user.email)) {
          console.warn('[Broker Layout] Access denied - user role:', user.role)
          router.push('/login')
          return
        }
      }

      // Verify Supabase session is still valid (if configured)
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: { session }, error } = await supabase.auth.getSession()

          if (!session && !error) {
            console.log('[Broker Layout] No Supabase session - using localStorage user (Quick Access mode)')
          }
        } catch (err) {
          console.error('[Broker Layout] Session verification error:', err)
        }
      }

      setIsVerifying(false)
    }

    verifyAccess()
  }, [user, isLoading, router, searchParams])

  const handleLogout = () => {
    logout()
  }

  // Show loading while verifying access
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Get user data from AuthContext or localStorage
  const currentUser = user || (() => {
    try {
      const stored = localStorage.getItem('naybourhood_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    )
  }

  return (
    <QueryProvider>
        <Toaster position="top-right" richColors closeButton />
        <DashboardLayout
          title={`Welcome back, ${currentUser.name?.split(' ')[0] || 'Broker'}`}
          userType="broker"
          userName={currentUser.name}
          userEmail={currentUser.email}
          onLogout={handleLogout}
        >
          {children}
        </DashboardLayout>
    </QueryProvider>
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
