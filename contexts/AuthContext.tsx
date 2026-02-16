'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isMasterAdmin, isInternalTeamEmail, buildDisplayName } from '@/lib/auth'
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
    if (!isSupabaseConfigured()) {
      return null
    }

    try {
      const supabase = createClient()

      // Fetch user_profiles with company data joined
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*, company:companies(*)')
        .eq('id', authUserId)
        .single()

      if (error) {
        console.error('[AuthContext] Error fetching user_profiles:', error)
        return null
      }

      // Build user object from user_profiles
      const fullName = buildDisplayName(
        userProfile?.first_name,
        userProfile?.last_name,
        email
      )

      // Get company data from joined query, fall back to company_name text field
      const companyData = userProfile?.company
      const companyName = companyData?.name || userProfile?.company_name

      // Determine role with master admin override (uses centralized auth config)
      let role = (userProfile?.user_type || 'developer') as UserRole
      if (isMasterAdmin(email)) {
        role = 'admin'
      }

      // Check if internal team member
      const isInternal = userProfile?.is_internal_team || isInternalTeamEmail(email)

      const appUser: User = {
        id: authUserId,
        email: email,
        name: fullName,
        role: role,
        company_id: userProfile?.company_id,
        company: companyName,
        avatarUrl: userProfile?.avatar_url,
        is_internal: isInternal,
        is_master_admin: isMasterAdmin(email),
        permission_role: userProfile?.permission_role,
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

          const { data: { session }, error } = await supabase.auth.getSession()

          if (session?.user && !error) {
            const appUser = await fetchUserProfile(session.user.id, session.user.email || '')
            if (appUser) {
              // Always use DB as source of truth for company_id
              // Do NOT fall back to localStorage - it may contain stale data
              setUser(appUser)
              localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
            }
          } else {
            // No valid Supabase session - check localStorage for Quick Access / demo mode
            const stored = localStorage.getItem('naybourhood_user')
            if (stored) {
              try {
                const storedUser = JSON.parse(stored)
                setUser(storedUser)
              } catch {
                localStorage.removeItem('naybourhood_user')
              }
            }
          }

          setIsLoading(false)

          // Listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
              if (event === 'SIGNED_IN' && session?.user) {
                const appUser = await fetchUserProfile(session.user.id, session.user.email || '')
                if (appUser) {
                  setUser(appUser)
                  localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
                  router.refresh()
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
          setIsLoading(false)
        }
      } else {
        // Supabase not configured - use localStorage for demo mode
        const stored = localStorage.getItem('naybourhood_user')
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored)
            setUser(parsedUser)
          } catch {
            localStorage.removeItem('naybourhood_user')
          }
        }
        setIsLoading(false)
      }
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
            router.refresh()
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
    // Clear local state and redirect immediately — never block on network
    setUser(null)
    localStorage.removeItem('naybourhood_user')
    router.push('/login')
    router.refresh()

    // Fire-and-forget Supabase session cleanup
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient()
        supabase.auth.signOut().catch((err: unknown) =>
          console.error('Supabase signOut error:', err)
        )
      } catch (error) {
        console.error('Supabase signOut error:', error)
      }
    }
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
