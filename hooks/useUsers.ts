'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { AppUser } from '@/types'

// Explicit columns for user_profiles table - no select('*')
const USER_PROFILES_COLUMNS = [
  'id', 'email', 'first_name', 'last_name', 'full_name',
  'user_type', 'company_id', 'company_name',
  'avatar_url', 'membership_status', 'email_confirmed',
  'last_active', 'onboarding_completed',
  'created_at', 'updated_at',
].join(', ')

export interface UseUsersOptions {
  page?: number
  limit?: number
}

function mapProfileToUser(p: Record<string, any>): AppUser {
  let status: 'active' | 'inactive' | 'pending' = 'pending'
  const emailConfirmed = p.email_confirmed ?? (p.last_active ? true : false)

  if (p.last_active) {
    const lastActiveDate = new Date(p.last_active)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    status = lastActiveDate > thirtyDaysAgo ? 'active' : 'inactive'
  } else if (p.membership_status === 'active') {
    status = 'active'
  }

  const firstName = p.first_name || ''
  const lastName = p.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || p.full_name || p.email || 'Unknown'

  return {
    id: p.id,
    name: fullName,
    email: p.email || '',
    role: p.user_type || p.role || 'developer',
    company_id: p.company_id,
    company: p.company_id,
    avatar_url: p.avatar_url,
    status,
    email_confirmed: emailConfirmed,
    last_active: p.last_active,
    created_at: p.created_at,
    invited_at: p.created_at,
  }
}

async function fetchUsers(
  options: UseUsersOptions
): Promise<{ data: AppUser[]; totalCount: number }> {
  if (!isSupabaseConfigured()) return { data: [], totalCount: 0 }
  const supabase = createClient()
  if (!supabase) return { data: [], totalCount: 0 }

  const { page = 0, limit = 50 } = options
  const from = page * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from('user_profiles')
    .select(USER_PROFILES_COLUMNS, { count: 'exact' })
    .order('first_name', { ascending: true })
    .range(from, to)

  if (!error && data && data.length > 0) {
    return {
      data: data.map(mapProfileToUser),
      totalCount: count ?? 0,
    }
  }

  // API fallback for Quick Access users
  try {
    const response = await fetch('/api/users/invite?demo=true')
    if (response.ok) {
      const result = await response.json()
      if (result.users && result.users.length > 0) {
        return {
          data: result.users.map(mapProfileToUser),
          totalCount: result.users.length,
        }
      }
    }
  } catch {
    // API fallback failed
  }

  return { data: [], totalCount: 0 }
}

export function useUsers(options: UseUsersOptions = {}) {
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', options],
    queryFn: () => fetchUsers(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const users = result?.data ?? []
  const totalCount = result?.totalCount ?? 0

  return {
    users,
    totalCount,
    isLoading,
    error: error?.message ?? null,
    refreshUsers: refetch,
  }
}
