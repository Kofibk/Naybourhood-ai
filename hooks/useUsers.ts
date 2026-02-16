'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { AppUser } from '@/types'

function mapProfileToUser(p: any): AppUser {
  // Determine status from membership_status field
  // 'pending' = invited but not yet accepted
  // 'active' = accepted invite and using the platform
  // 'inactive' = was active but hasn't logged in recently
  let status: 'active' | 'inactive' | 'pending' = 'pending'
  
  if (p.membership_status === 'active') {
    status = 'active'
  } else if (p.membership_status === 'inactive') {
    status = 'inactive'
  } else if (p.membership_status === 'pending') {
    status = 'pending'
  }
  
  // Email is confirmed if they've accepted the invite (status is active)
  const emailConfirmed = p.email_confirmed ?? (status === 'active')

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
    is_internal: p.is_internal_team || false,
    created_at: p.created_at,
    invited_at: p.created_at,
  }
}

async function fetchUsers(): Promise<AppUser[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = createClient()
  if (!supabase) return []

  // Ensure we have an authenticated session before querying (RLS requires it)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  // Try direct query first
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('first_name', { ascending: true })

  console.log('[useUsers] 📋 Direct query result:', {
    hasData: !!data,
    count: data?.length || 0,
    error: error?.message,
    // Log first user to check is_internal_team field
    sampleUser: data?.[0] ? {
      id: data[0].id,
      email: data[0].email,
      user_type: data[0].user_type,
      is_internal_team: data[0].is_internal_team,
      membership_status: data[0].membership_status,
    } : null,
  })

  if (!error && data && data.length > 0) {
    const mapped = data.map(mapProfileToUser)
    console.log('[useUsers] 👥 Mapped users:', {
      total: mapped.length,
      internalCount: mapped.filter((u: AppUser) => u.is_internal).length,
      sampleMapped: mapped[0] ? {
        id: mapped[0].id,
        email: mapped[0].email,
        role: mapped[0].role,
        is_internal: mapped[0].is_internal,
        status: mapped[0].status,
      } : null,
    })
    return mapped
  }

  // API fallback for Quick Access users or if direct query fails
  console.log('[useUsers] 🔄 Trying API fallback...')
  try {
    const response = await fetch('/api/users/invite?demo=true')
    if (response.ok) {
      const result = await response.json()
      console.log('[useUsers] 📋 API fallback result:', {
        hasUsers: !!result.users,
        count: result.users?.length || 0,
      })
      if (result.users && result.users.length > 0) {
        return result.users.map(mapProfileToUser)
      }
    }
  } catch (e) {
    console.error('[useUsers] ❌ API fallback failed:', e)
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
