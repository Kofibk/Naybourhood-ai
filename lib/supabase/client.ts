import { createBrowserClient } from '@supabase/ssr'

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Custom storage that uses sessionStorage (cleared when browser closes)
// instead of localStorage (persists forever)
const sessionStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(key)
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(key, value)
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(key)
  },
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('[Supabase] Not configured - missing URL or key')
    return null as any
  }

  // Create browser client with IMPLICIT flow to allow cross-browser magic links
  // PKCE flow (default) requires the magic link to be opened in the SAME browser
  // Implicit flow uses #access_token in URL which works cross-browser
  // Session stored in sessionStorage so closing the browser logs the user out
  return createBrowserClient(url, key, {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      storage: sessionStorageAdapter,
    }
  })
}
