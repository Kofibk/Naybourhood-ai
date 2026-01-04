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

  // Create browser client with default settings
  // The @supabase/ssr package handles cookies automatically
  return createBrowserClient(url, key)
}
