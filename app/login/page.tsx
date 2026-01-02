'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo, LogoIcon } from '@/components/Logo'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

const demoAccounts = [
  { email: 'kofi@naybourhood.ai', role: 'Admin', path: '/admin' },
  { email: 'developer@test.com', role: 'Developer', path: '/developer' },
  { email: 'agent@test.com', role: 'Agent', path: '/agent' },
  { email: 'broker@test.com', role: 'Broker', path: '/broker' },
]

// Demo users for login
const demoUsers: Record<string, { name: string; role: string }> = {
  'kofi@naybourhood.ai': { name: 'Kofi', role: 'admin' },
  'developer@test.com': { name: 'John Smith', role: 'developer' },
  'agent@test.com': { name: 'Michael Davies', role: 'agent' },
  'broker@test.com': { name: 'Lisa Green', role: 'broker' },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Simulate magic link sending
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // For demo purposes, check if it's a known email and auto-login
      const demoUser = demoUsers[email.toLowerCase()]

      if (demoUser) {
        // Demo: Auto-login for known demo accounts
        localStorage.setItem(
          'naybourhood_user',
          JSON.stringify({
            id: 'U999',
            email,
            name: demoUser.name,
            role: demoUser.role,
          })
        )

        // Route based on role
        if (demoUser.role === 'admin') router.push('/admin')
        else if (demoUser.role === 'agent') router.push('/agent')
        else if (demoUser.role === 'broker') router.push('/broker')
        else router.push('/developer')
      } else {
        // Show magic link sent message for unknown emails
        setMagicLinkSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, path: string) => {
    setIsLoading(true)
    const user = demoUsers[demoEmail.toLowerCase()]
    localStorage.setItem(
      'naybourhood_user',
      JSON.stringify({
        id: `U${Math.random().toString(36).substr(2, 3)}`,
        email: demoEmail,
        name: user?.name || demoEmail.split('@')[0],
        role: user?.role || 'developer',
      })
    )
    router.push(path)
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

        {/* Login Form - Magic Link Only */}
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

        {/* Demo Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
            <CardDescription className="text-xs">
              Click to sign in instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => handleDemoLogin(account.email, account.path)}
                disabled={isLoading}
              >
                <Badge variant="secondary" className="mr-2 text-[10px]">
                  {account.role}
                </Badge>
                <span className="truncate">{account.email.split('@')[0]}</span>
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
