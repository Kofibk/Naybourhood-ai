'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataProvider } from '@/contexts/DataContext'
import { AuthProvider } from '@/contexts/AuthContext'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (!stored) {
      router.push('/login')
      return
    }
    try {
      const parsed = JSON.parse(stored)
      setUser(parsed)
    } catch {
      router.push('/login')
    }
  }, [router])

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
    <AuthProvider>
      <DataProvider>
        <DashboardLayout
          title={`Welcome back, ${user.name?.split(' ')[0] || 'Broker'}`}
          userType="broker"
          userName={user.name}
          onLogout={handleLogout}
        >
          {children}
        </DashboardLayout>
      </DataProvider>
    </AuthProvider>
  )
}
