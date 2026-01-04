'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'

interface User {
  id: string
  name: string
  email: string
  role: string
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
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

      if (userId && email && role) {
        const userData = { id: userId, email, name: name || email.split('@')[0], role }
        localStorage.setItem('naybourhood_user', JSON.stringify(userData))
        setUser(userData)
        // Clear URL params
        window.history.replaceState({}, '', '/admin')
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
      // Validate user has admin role
      if (parsed.role !== 'admin') {
        console.warn('[Admin Layout] Access denied - user role:', parsed.role)
        router.push('/login')
        return
      }
      setUser(parsed)
    } catch {
      router.push('/login')
    }
  }, [router, searchParams])

  const handleLogout = () => {
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
    <DataProvider>
      <DashboardLayout
        title={`Welcome back, ${user.name?.split(' ')[0] || 'Admin'}`}
        userType="admin"
        userName={user.name}
        userEmail={user.email}
        onLogout={handleLogout}
      >
        {children}
      </DashboardLayout>
    </DataProvider>
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
