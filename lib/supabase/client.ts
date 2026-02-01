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

  // Log browser cookies for debugging
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';').map(c => c.trim())
    const supabaseCookies = cookies.filter(c => c.includes('supabase') || c.includes('sb-'))
    console.log('[Supabase Client] 🌐 Creating browser client:', {
      url: url.substring(0, 30) + '...',
      totalCookies: cookies.length,
      supabaseCookieCount: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.split('=')[0]),
      hasCodeVerifier: supabaseCookies.some(c => c.includes('code-verifier') || c.includes('code_verifier')),
      currentPath: window.location.pathname,
    })
  }

  // Create browser client with default settings
  // The @supabase/ssr package handles cookies automatically
  return createBrowserClient(url, key)
}
