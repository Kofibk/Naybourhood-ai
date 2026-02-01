import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  const cookieStore = cookies()
  
  // Log all supabase-related cookies for debugging
  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
  
  console.log('[Supabase Server] 🔧 Creating server client:', {
    totalCookies: allCookies.length,
    supabaseCookieCount: supabaseCookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.name),
    hasCodeVerifier: supabaseCookies.some(c => c.name.includes('code-verifier') || c.name.includes('code_verifier')),
    hasAuthToken: supabaseCookies.some(c => c.name.includes('auth-token')),
    flowType: 'implicit',
  })

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
      },
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          if (name.includes('code-verifier') || name.includes('code_verifier')) {
            console.log('[Supabase Server] 🔑 PKCE code verifier cookie access:', {
              name,
              hasValue: !!value,
              valueLength: value?.length,
            })
          }
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            if (name.includes('supabase') || name.includes('sb-')) {
              console.log('[Supabase Server] 🍪 Cookie SET:', { 
                name, 
                valueLength: value?.length,
              })
            }
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component
            console.log('[Supabase Server] ⚠️ Cookie SET failed (Server Component):', { name })
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            if (name.includes('supabase') || name.includes('sb-')) {
              console.log('[Supabase Server] 🍪 Cookie REMOVE:', { name })
            }
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component
            console.log('[Supabase Server] ⚠️ Cookie REMOVE failed (Server Component):', { name })
          }
        },
      },
    }
  )
}

// Admin client for server-side operations (user invitations, etc.)
// Requires SUPABASE_SERVICE_ROLE_KEY environment variable
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
