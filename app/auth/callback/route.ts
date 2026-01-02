import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Redirect based on email
      const email = data.user.email?.toLowerCase() || ''

      let redirectPath = '/developer'
      if (email === 'kofi@naybourhood.ai' || email.includes('admin')) {
        redirectPath = '/admin'
      } else if (email.includes('agent')) {
        redirectPath = '/agent'
      } else if (email.includes('broker')) {
        redirectPath = '/broker'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
