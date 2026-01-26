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
    if (!isSupabaseConfigured()) return null

    try {
      const supabase = createClient()

      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*, company:companies(*)')
        .eq('id', authUserId)
        .single()

      if (error) {
        console.error('[AuthContext] Error fetching user_profiles:', error)
        return null
      }

      const fullName = buildDisplayName(
        userProfile?.first_name,
        userProfile?.last_name,
        email
      )

      const companyData = userProfile?.company
      const companyName = companyData?.name || userProfile?.company_name

      let role = (userProfile?.user_type || 'developer') as UserRole
      if (isMasterAdmin(email)) {
        role = 'admin'
      }

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

  // Initialize auth - FAST: check localStorage first, validate later
  useEffect(() => {
    const initializeAuth = async () => {
      // STEP 1: Check localStorage FIRST for instant load
      const stored = localStorage.getItem('naybourhood_user')
      if (stored) {
        try {
          const storedUser = JSON.parse(stored)
          setUser(storedUser)
          setIsLoading(false) // Immediately stop loading!

          // STEP 2: Validate session in background (don't block UI)
          if (isSupabaseConfigured()) {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.user) {
              // Session valid - refresh user data in background
              const freshUser = await fetchUserProfile(session.user.id, session.user.email || '')
              if (freshUser) {
                setUser(freshUser)
                localStorage.setItem('naybourhood_user', JSON.stringify(freshUser))
              }
            }
            // If no session but we have localStorage, keep using it (offline mode)
          }
          return
        } catch {
          localStorage.removeItem('naybourhood_user')
        }
      }

      // STEP 3: No localStorage - must check Supabase (slower path, only for fresh logins)
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: { session }, error } = await supabase.auth.getSession()

          if (session?.user && !error) {
            const appUser = await fetchUserProfile(session.user.id, session.user.email || '')
            if (appUser) {
              setUser(appUser)
              localStorage.setItem('naybourhood_user', JSON.stringify(appUser))
            }
          }

          // Set up auth state listener
          supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
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
        } catch (error) {
          console.error('[AuthContext] Init error:', error)
        }
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [])

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
