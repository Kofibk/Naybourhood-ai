'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { AppUser } from '@/types'

function mapProfileToUser(p: any): AppUser {
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

async function fetchUsers(): Promise<AppUser[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = createClient()
  if (!supabase) return []

  // Try direct query first
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('first_name', { ascending: true })

  if (!error && data && data.length > 0) {
    return data.map(mapProfileToUser)
  }

  // API fallback for Quick Access users
  try {
    const response = await fetch('/api/users/invite?demo=true')
    if (response.ok) {
      const result = await response.json()
      if (result.users && result.users.length > 0) {
        return result.users.map(mapProfileToUser)
      }
    }
  } catch {
    // API fallback failed
  }

  return []
}

export function useUsers() {
  const { data: users = [], isLoading, error, refetch } = useQuery<AppUser[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  return { users, isLoading, error: error?.message ?? null, refreshUsers: refetch }
}
