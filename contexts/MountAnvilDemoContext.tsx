'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DEMO_USERS, DemoUser } from '@/lib/mount-anvil-demo-data'

interface MountAnvilDemoContextType {
  user: DemoUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const MountAnvilDemoContext = createContext<MountAnvilDemoContextType | undefined>(undefined)

const DEMO_AUTH_KEY = 'mount_anvil_demo_user'

export function MountAnvilDemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(DEMO_AUTH_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const demoUser = DEMO_USERS.find(u => u.id === parsed.id)
        if (demoUser) {
          setUser(demoUser)
        }
      } catch {
        localStorage.removeItem(DEMO_AUTH_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 800))

    const normalizedEmail = email.toLowerCase().trim()
    const demoUser = DEMO_USERS.find(u => u.email.toLowerCase() === normalizedEmail)

    if (!demoUser) {
      return { success: false, error: 'No account found with this email' }
    }

    if (demoUser.password !== password) {
      return { success: false, error: 'Incorrect password' }
    }

    // Store session
    localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ id: demoUser.id }))
    setUser(demoUser)

    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem(DEMO_AUTH_KEY)
    setUser(null)
  }

  return (
    <MountAnvilDemoContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </MountAnvilDemoContext.Provider>
  )
}

export function useMountAnvilDemo() {
  const context = useContext(MountAnvilDemoContext)
  if (context === undefined) {
    throw new Error('useMountAnvilDemo must be used within a MountAnvilDemoProvider')
  }
  return context
}
