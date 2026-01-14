'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  company_id?: string
}

function AgentLayoutInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if coming from auth callback
    const authSuccess = searchParams.get('auth') === 'success'
    if (authSuccess) {
      const userId = searchParams.get('userId')
      const email = searchParams.get('email')
      const name = searchParams.get('name')
      const role = searchParams.get('role')
      const companyId = searchParams.get('companyId')

      if (userId && email && role) {
        const userData: User = {
          id: userId,
          email,
          name: name || email.split('@')[0],
          role,
          company_id: companyId || undefined
        }
        localStorage.setItem('naybourhood_user', JSON.stringify(userData))
        setUser(userData)
        window.history.replaceState({}, '', '/agent')
        return
      }
    }

    const stored = localStorage.getItem('naybourhood_user')
    if (!stored) {
      router.push('/login')
      return
    }
    try {
      const parsed = JSON.parse(stored)
      // Validate user has agent role (or admin for full access)
      if (parsed.role !== 'agent' && parsed.role !== 'admin') {
        console.warn('[Agent Layout] Access denied - user role:', parsed.role)
        router.push('/login')
        return
      }
      setUser(parsed)
    } catch {
      router.push('/login')
    }
  }, [router, searchParams])

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    localStorage.removeItem('naybourhood_user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <DataProvider>
        <Toaster position="top-right" richColors closeButton />
        <DashboardLayout
          title={`Welcome back, ${user.name?.split(' ')[0] || 'Agent'}`}
          userType="agent"
          userName={user.name}
          onLogout={handleLogout}
        >
          {children}
        </DashboardLayout>
      </DataProvider>
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
