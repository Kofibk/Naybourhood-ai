import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Log cookies being read/written for auth debugging
  const allCookies = request.cookies.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
  
  console.log('[Supabase Middleware] 🔄 updateSession called:', {
    pathname,
    supabaseCookieCount: supabaseCookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.name),
    hasCodeVerifier: supabaseCookies.some(c => c.name.includes('code-verifier') || c.name.includes('code_verifier')),
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          if (name.includes('supabase') || name.includes('sb-')) {
            console.log('[Supabase Middleware] 🍪 Cookie GET:', { 
              name, 
              hasValue: !!value,
              valuePreview: value?.substring(0, 30),
            })
          }
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          if (name.includes('supabase') || name.includes('sb-')) {
            console.log('[Supabase Middleware] 🍪 Cookie SET:', { 
              name, 
              valueLength: value?.length,
              options: { ...options, value: undefined },
            })
          }
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          if (name.includes('supabase') || name.includes('sb-')) {
            console.log('[Supabase Middleware] 🍪 Cookie REMOVE:', { name })
          }
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('[Supabase Middleware] 👤 getUser result:', {
    pathname,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    error: error?.message,
  })

  return response
}
