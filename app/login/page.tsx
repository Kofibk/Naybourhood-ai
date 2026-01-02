'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

const demoAccounts = [
  { email: 'admin@naybourhood.ai', role: 'Admin', path: '/admin' },
  { email: 'developer@test.com', role: 'Developer', path: '/developer' },
  { email: 'agent@test.com', role: 'Agent', path: '/agent' },
  { email: 'broker@test.com', role: 'Broker', path: '/broker' },
]

// Demo users for login
const demoUsers: Record<string, { name: string; role: string }> = {
  'admin@naybourhood.ai': { name: 'Kofi', role: 'admin' },
  'developer@test.com': { name: 'John Smith', role: 'developer' },
  'agent@test.com': { name: 'Michael Davies', role: 'agent' },
  'broker@test.com': { name: 'Lisa Green', role: 'broker' },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Demo login - store user in localStorage
      const demoUser = demoUsers[email.toLowerCase()]
      const user = demoUser || {
        name: email.split('@')[0],
        role: 'developer',
      }

      localStorage.setItem(
        'naybourhood_user',
        JSON.stringify({
          id: 'U999',
          email,
          name: user.name,
          role: user.role,
        })
      )

      // Route based on email/role
      if (email.includes('admin')) router.push('/admin')
      else if (email.includes('agent')) router.push('/agent')
      else if (email.includes('broker')) router.push('/broker')
      else router.push('/developer')
    } catch {
      setError('Something went wrong')
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">N</span>
            </div>
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
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
            <CardDescription className="text-xs">
              Click to sign in instantly (any password works)
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
          <Link href="/login" className="text-primary hover:underline">
            Contact sales
          </Link>
        </p>
      </div>
    </div>
  )
}
