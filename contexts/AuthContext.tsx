'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setUserRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for development/testing
const demoUsers: Record<string, User> = {
  'admin@naybourhood.ai': {
    id: 'U001',
    name: 'Kofi',
    email: 'admin@naybourhood.ai',
    role: 'admin',
  },
  'developer@test.com': {
    id: 'U002',
    name: 'John Smith',
    email: 'developer@test.com',
    role: 'developer',
    company: 'Berkeley Group',
  },
  'agent@test.com': {
    id: 'U003',
    name: 'Michael Davies',
    email: 'agent@test.com',
    role: 'agent',
    company: 'JLL',
  },
  'broker@test.com': {
    id: 'U004',
    name: 'Lisa Green',
    email: 'broker@test.com',
    role: 'broker',
    company: 'Tudor Financial',
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user on mount
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('naybourhood_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // If Supabase is configured, try Supabase auth
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (!error && data.user) {
          // Fetch profile from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          const appUser: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: profile?.full_name || email.split('@')[0],
            role: (profile?.role as UserRole) || 'developer',
            company: profile?.company_id,
          }

          setUser(appUser)
          localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
          setIsLoading(false)
          return true
        }
      }

      // Fallback to demo login
      const demoUser = demoUsers[email.toLowerCase()]
      if (demoUser) {
        setUser(demoUser)
        localStorage.setItem('naybourhood_user', JSON.stringify(demoUser))
        setIsLoading(false)
        return true
      }

      // Create user from email for demo purposes
      const newUser: User = {
        id: 'U999',
        name: email.split('@')[0],
        email: email,
        role: 'developer',
      }
      setUser(newUser)
      localStorage.setItem('naybourhood_user', JSON.stringify(newUser))
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    setUser(null)
    localStorage.removeItem('naybourhood_user')
    router.push('/login')
  }

  const setUserRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role }
      setUser(updated)
      localStorage.setItem('naybourhood_user', JSON.stringify(updated))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
