'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { QueryProvider } from '@/contexts/QueryProvider'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isMasterAdmin, canAccessDashboard } from '@/lib/auth'
import { Toaster } from 'sonner'

function AgentLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyAccess = async () => {
      console.log('[Agent Layout] 🔄 Starting access verification...')
      console.log('[Agent Layout] isLoading:', isLoading, 'user:', user ? { id: user.id, role: user.role } : null)
      
      // Check if coming from auth callback with URL params
      const authSuccess = searchParams.get('auth') === 'success'
      console.log('[Agent Layout] Auth success param:', authSuccess)
      
      if (authSuccess) {
        const userId = searchParams.get('userId')
        const email = searchParams.get('email')
        const name = searchParams.get('name')
        const role = searchParams.get('role')
        const companyId = searchParams.get('companyId')

        console.log('[Agent Layout] 📋 URL params received:', { userId, email, name, role, companyId })

        if (userId && email && role) {
          // Verify role allows agent access
          console.log('[Agent Layout] Checking if role allows agent access:', role)
          if (!canAccessDashboard(role, 'agent') && !isMasterAdmin(email)) {
            console.warn('[Agent Layout] ❌ Access denied - user role:', role)
            router.push('/login')
            return
          }

          console.log('[Agent Layout] ✅ Role check passed')

          // Save to sessionStorage + localStorage for AuthContext to pick up
          const userData = JSON.stringify({
            id: userId,
            email,
            name: name || email.split('@')[0],
            role,
            company_id: companyId || undefined,
            is_master_admin: isMasterAdmin(email),
          })
          sessionStorage.setItem('naybourhood_user', userData)
          localStorage.setItem('naybourhood_user', userData)
          
          // Clear URL params
          console.log('[Agent Layout] Clearing URL params')
          window.history.replaceState({}, '', '/agent')
          
          console.log('[Agent Layout] ✅ isVerifying = false (after URL params)')
          setIsVerifying(false)
          return
        } else {
          console.warn('[Agent Layout] ⚠️ Missing required URL params:', { userId, email, role })
        }
      }

      // Wait for AuthContext to load
      if (isLoading) {
        console.log('[Agent Layout] ⏳ Waiting for AuthContext to finish loading...')
        return
      }

      console.log('[Agent Layout] AuthContext loading complete')

      // No user from AuthContext - check sessionStorage as fallback
      if (!user) {
        const stored = sessionStorage.getItem('naybourhood_user') || localStorage.getItem('naybourhood_user')
        if (!stored) {
          router.push('/login')
          return
        }

        try {
          const parsed = JSON.parse(stored)
          // Validate user has agent access
          if (!canAccessDashboard(parsed.role, 'agent') && !isMasterAdmin(parsed.email)) {
            router.push('/login')
            return
          }
        } catch {
          router.push('/login')
          return
        }
      } else {
        // User exists from AuthContext - verify they have agent access
        if (!canAccessDashboard(user.role, 'agent') && !isMasterAdmin(user.email)) {
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
            sessionStorage.removeItem('naybourhood_user')
            localStorage.removeItem('naybourhood_user')
            router.push('/login')
            return
          }
        } catch (err) {
          console.error('[Agent Layout] Session verification error:', err)
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

  // Get user data from AuthContext or sessionStorage
  const currentUser = user || (() => {
    try {
      const stored = sessionStorage.getItem('naybourhood_user') || localStorage.getItem('naybourhood_user')
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
          title={`Welcome back, ${currentUser.name?.split(' ')[0] || 'Agent'}`}
          userType="agent"
          userName={currentUser.name}
          userEmail={currentUser.email}
          onLogout={handleLogout}
        >
          {children}
        </DashboardLayout>
    </QueryProvider>
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
