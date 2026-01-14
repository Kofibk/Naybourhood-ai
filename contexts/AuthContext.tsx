'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User, UserRole } from '@/types'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fetch user profile from Supabase and build User object
  const fetchUserProfile = async (authUserId: string, email: string): Promise<User | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createClient()

      // First check user_profiles (from onboarding) with company data joined
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*, company:companies(*)')
        .eq('id', authUserId)
        .single()

      // Also check profiles table (legacy or admin-created) with company data joined
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, company:companies(*)')
        .eq('id', authUserId)
        .single()

      // Merge data from both tables, preferring user_profiles for onboarded users
      const role = userProfile?.user_type || profile?.role || 'developer'
      const fullName = userProfile?.first_name
        ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
        : profile?.full_name || email.split('@')[0]

      // Get company data - prefer joined company data, fall back to company_name text field
      const companyData = userProfile?.company || profile?.company
      const companyId = userProfile?.company_id || profile?.company_id
      const companyName = companyData?.name || userProfile?.company_name

      const appUser: User = {
        id: authUserId,
        email: email,
        name: fullName,
        role: role as UserRole,
        company_id: companyId,
        company: companyName,
        avatarUrl: userProfile?.avatar_url || profile?.avatar_url,
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
            // No valid Supabase session - check localStorage for demo mode
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
            async (event: AuthChangeEvent, session: Session | null) => {
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
          localStorage.removeItem('naybourhood_user')
        }
      } else {
        // Supabase not configured - use localStorage for demo mode
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
      // Try Supabase auth first if configured
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

      setIsLoading(false)
      return false
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
