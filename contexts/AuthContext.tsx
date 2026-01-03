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
  refreshUser: () => Promise<void>
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
  'kofi@naybourhood.ai': {
    id: 'U001',
    name: 'Kofi',
    email: 'kofi@naybourhood.ai',
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

  // Fetch user profile from Supabase and build User object
  const fetchUserProfile = async (authUserId: string, email: string): Promise<User | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createClient()

      // Fetch profile with company info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single()

      if (profileError) {
        console.error('[AuthContext] Profile fetch error:', profileError)
        return null
      }

      // If user has company_id, fetch company name
      let companyName = undefined
      if (profile?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .single()

        companyName = company?.name
      }

      const appUser: User = {
        id: authUserId,
        email: email,
        name: profile?.full_name || email.split('@')[0],
        role: (profile?.role as UserRole) || 'developer',
        company_id: profile?.company_id,
        company: companyName,
        avatarUrl: profile?.avatar_url,
      }

      return appUser
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error)
      return null
    }
  }

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()

          // Check for existing Supabase session
          const { data: { session }, error } = await supabase.auth.getSession()

          if (session?.user && !error) {
            const appUser = await fetchUserProfile(session.user.id, session.user.email || '')
            if (appUser) {
              setUser(appUser)
              localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
            }
          } else {
            // Fallback to localStorage for demo mode
            const stored = localStorage.getItem('naybourhood_user')
            if (stored) {
              try {
                setUser(JSON.parse(stored))
              } catch {
                localStorage.removeItem('naybourhood_user')
              }
            }
          }

          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('[AuthContext] Auth state changed:', event)

              if (event === 'SIGNED_IN' && session?.user) {
                const appUser = await fetchUserProfile(session.user.id, session.user.email || '')
                if (appUser) {
                  setUser(appUser)
                  localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
                }
              } else if (event === 'SIGNED_OUT') {
                setUser(null)
                localStorage.removeItem('naybourhood_user')
              }
            }
          )

          // Cleanup subscription on unmount
          return () => {
            subscription.unsubscribe()
          }
        } catch (error) {
          console.error('[AuthContext] Init error:', error)
          // Fallback to localStorage
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            try {
              setUser(JSON.parse(stored))
            } catch {
              localStorage.removeItem('naybourhood_user')
            }
          }
        }
      } else {
        // No Supabase - use localStorage only
        const stored = localStorage.getItem('naybourhood_user')
        if (stored) {
          try {
            setUser(JSON.parse(stored))
          } catch {
            localStorage.removeItem('naybourhood_user')
          }
        }
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // Refresh user profile from database
  const refreshUser = async () => {
    if (!user?.id || !isSupabaseConfigured()) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const appUser = await fetchUserProfile(session.user.id, session.user.email || '')
      if (appUser) {
        setUser(appUser)
        localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
      }
    }
  }

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
          const appUser = await fetchUserProfile(data.user.id, data.user.email || email)

          if (appUser) {
            setUser(appUser)
            localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
            setIsLoading(false)
            return true
          }
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
        refreshUser,
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
