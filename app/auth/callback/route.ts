import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const email = data.user.email?.toLowerCase() || ''

      // Fetch user profile from database to get their actual role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, company_id')
        .eq('id', data.user.id)
        .single()

      // Use database role if available, otherwise default to developer
      const role = profile?.role || 'developer'

      // Determine redirect path based on database role
      let redirectPath = '/developer'
      switch (role) {
        case 'admin':
          redirectPath = '/admin'
          break
        case 'agent':
          redirectPath = '/agent'
          break
        case 'broker':
          redirectPath = '/broker'
          break
        case 'developer':
        default:
          redirectPath = '/developer'
          break
      }

      // Redirect with role info in URL so client can store in localStorage
      const redirectUrl = new URL(`${origin}${redirectPath}`)
      redirectUrl.searchParams.set('auth', 'success')
      redirectUrl.searchParams.set('userId', data.user.id)
      redirectUrl.searchParams.set('email', email)
      redirectUrl.searchParams.set('name', profile?.full_name || email.split('@')[0])
      redirectUrl.searchParams.set('role', role)

      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
