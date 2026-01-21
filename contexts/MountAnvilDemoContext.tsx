'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { DEMO_USERS, DemoUser } from '@/lib/mount-anvil-demo-data'

interface MountAnvilDemoContextType {
  user: DemoUser
  isAuthenticated: boolean
  isLoading: boolean
  switchUser: (userId: string) => void
  logout: () => void
}

const MountAnvilDemoContext = createContext<MountAnvilDemoContextType | undefined>(undefined)

const DEMO_AUTH_KEY = 'mount_anvil_demo_user'

// Default user for demo (Rowena)
const DEFAULT_USER = DEMO_USERS[0]

export function MountAnvilDemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser>(DEFAULT_USER)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount, default to Rowena
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

  const switchUser = (userId: string) => {
    const demoUser = DEMO_USERS.find(u => u.id === userId)
    if (demoUser) {
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ id: demoUser.id }))
      setUser(demoUser)
    }
  }

  const logout = () => {
    localStorage.removeItem(DEMO_AUTH_KEY)
    setUser(DEFAULT_USER)
  }

  return (
    <MountAnvilDemoContext.Provider
      value={{
        user,
        isAuthenticated: true, // Always authenticated in demo mode
        isLoading,
        switchUser,
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
