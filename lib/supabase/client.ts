import { createBrowserClient } from '@supabase/ssr'

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('[Supabase] Not configured - missing URL or key')
    return null as any
  }

  // Create browser client with PKCE flow (Supabase recommended, implicit is deprecated)
  // PKCE uses code exchange which is more secure than implicit token-in-URL
  // Magic links will work in same browser; for cross-device, users should log in directly
  return createBrowserClient(url, key, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
    }
  })
}
