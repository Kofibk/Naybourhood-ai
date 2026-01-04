'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { LogoIcon } from '@/components/Logo'
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()
  const supabaseConfigured = isSupabaseConfigured()

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      if (supabaseConfigured) {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Fetch user profile to get role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profile?.role) {
            redirectBasedOnRole(profile.role)
          }
        }
      }
    }

    checkSession()
  }, [supabaseConfigured])

  const redirectBasedOnRole = (role: string) => {
    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'agent') {
      router.push('/agent')
    } else if (role === 'broker') {
      router.push('/broker')
    } else {
      router.push('/developer')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!supabaseConfigured) {
        setError('Authentication service not configured. Please contact support.')
        setIsLoading(false)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMagicLinkSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <LogoIcon className="w-16 h-16 mx-auto" variant="light" />
          <div className="space-y-2">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-medium">Configuration Error</h1>
            <p className="text-muted-foreground">
              The authentication service is not configured. Please contact support.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <LogoIcon className="w-16 h-16 mx-auto" variant="light" />
          <div className="space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-medium">Check your email</h1>
            <p className="text-muted-foreground">
              We&apos;ve sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to sign in to your account.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMagicLinkSent(false)
              setEmail('')
            }}
          >
            Use a different email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <LogoIcon className="w-14 h-14 mx-auto" variant="light" />
          </Link>
          <h1 className="mt-4 font-display text-2xl font-medium">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your Naybourhood account
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send Magic Link
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                We&apos;ll email you a secure link to sign in — no password needed.
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="mailto:hello@naybourhood.ai" className="text-primary hover:underline">
            Contact sales
          </a>
        </p>
      </div>
    </div>
  )
}
