'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogoIcon } from '@/components/Logo'
import { Loader2, Mail, CheckCircle, Zap } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

const demoAccounts = [
  { email: 'kofi@naybourhood.ai', role: 'Admin', path: '/admin', name: 'Kofi' },
  { email: 'developer@test.com', role: 'Developer', path: '/developer', name: 'Developer' },
  { email: 'agent@test.com', role: 'Agent', path: '/agent', name: 'Agent' },
  { email: 'broker@test.com', role: 'Broker', path: '/broker', name: 'Broker' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()
  const supabaseConfigured = isSupabaseConfigured()

  // Check if user is already logged in (localStorage for demo mode)
  useEffect(() => {
    const storedUser = localStorage.getItem('naybourhood_user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      redirectBasedOnRole(user.role)
    }
  }, [])

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

  const redirectBasedOnEmail = (userEmail: string) => {
    const emailLower = userEmail.toLowerCase()
    if (emailLower === 'kofi@naybourhood.ai' || emailLower.includes('admin')) {
      router.push('/admin')
    } else if (emailLower.includes('agent')) {
      router.push('/agent')
    } else if (emailLower.includes('broker')) {
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
      if (supabaseConfigured) {
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
      } else {
        // Demo mode - just redirect
        handleDemoAccess(email)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick demo access - bypasses Supabase auth
  const handleDemoAccess = (demoEmail: string) => {
    const account = demoAccounts.find(a => a.email === demoEmail)
    const emailLower = demoEmail.toLowerCase()

    let role = 'developer'
    let name = demoEmail.split('@')[0]
    let path = '/developer'

    if (account) {
      role = account.role.toLowerCase()
      name = account.name
      path = account.path
    } else if (emailLower.includes('admin') || emailLower === 'kofi@naybourhood.ai') {
      role = 'admin'
      path = '/admin'
    } else if (emailLower.includes('agent')) {
      role = 'agent'
      path = '/agent'
    } else if (emailLower.includes('broker')) {
      role = 'broker'
      path = '/broker'
    }

    // Store in localStorage for session
    localStorage.setItem('naybourhood_user', JSON.stringify({
      id: `demo-${Date.now()}`,
      email: demoEmail,
      name: name,
      role: role,
    }))

    router.push(path)
  }

  const handleQuickAccess = (account: typeof demoAccounts[0]) => {
    setIsLoading(true)
    handleDemoAccess(account.email)
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
                {supabaseConfigured ? 'Send Magic Link' : 'Continue'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {supabaseConfigured
                  ? "We'll email you a secure link to sign in — no password needed."
                  : "Demo mode - click continue to access the dashboard."
                }
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access - Always works */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Quick Access
            </CardTitle>
            <CardDescription className="text-xs">
              Click to access dashboard instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => handleQuickAccess(account)}
                disabled={isLoading}
              >
                <Badge variant="secondary" className="mr-2 text-[10px]">
                  {account.role}
                </Badge>
                <span className="truncate">{account.name}</span>
              </Button>
            ))}
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
