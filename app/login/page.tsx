'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoIcon } from '@/components/Logo'
import { AuthHandler } from '@/components/AuthHandler'
import { Loader2, Mail, Lock, CheckCircle, Eye, EyeOff, AlertCircle, Shield, HardHat, Users, Briefcase } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isMasterAdmin } from '@/lib/auth'

// Master admin companies for quick access
const MASTER_ADMIN_COMPANIES = [
  { id: 'd4a3e617-422e-4c7e-a933-4214d534b927', name: 'Million Pound Homes' },
  { id: 'mount-anvil-001', name: 'Mount Anvil' },
  { id: 'ad165cde-0d30-4084-b798-063dabfa7e7b', name: 'Tudor Financial' },
]

// Navigation lock to prevent multiple redirects
let isNavigating = false

function navigateTo(path: string) {
  if (isNavigating) return
  isNavigating = true
  window.location.replace(path)
}

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [masterAdminCompany, setMasterAdminCompany] = useState(MASTER_ADMIN_COMPANIES[0])
  const searchParams = useSearchParams()
  const supabaseConfigured = isSupabaseConfigured()
  const hasCheckedAuth = useRef(false)

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorType = searchParams.get('error_type')

    if (errorParam) {
      setError(errorParam)

      if (errorType === 'pkce') {
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        url.searchParams.delete('error_type')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams])

  // Check if user is already logged in - ONLY ONCE
  useEffect(() => {
    if (hasCheckedAuth.current || isNavigating) return
    hasCheckedAuth.current = true

    // Check localStorage first - instant
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user.role) {
          setIsRedirecting(true)
          navigateTo(`/${user.role === 'admin' ? 'admin' : user.role}`)
          return
        }
      } catch {
        localStorage.removeItem('naybourhood_user')
      }
    }

    // Check Supabase session in background
    if (supabaseConfigured) {
      const checkSupabaseAuth = async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (user && !isNavigating) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_type, first_name, last_name, company_id, onboarding_completed')
              .eq('id', user.id)
              .single()

            if (!profile?.onboarding_completed) {
              setIsRedirecting(true)
              navigateTo('/onboarding')
              return
            }

            let role = profile?.user_type || 'developer'
            if (isMasterAdmin(user.email)) {
              role = 'admin'
            }

            const fullName = profile?.first_name
              ? `${profile.first_name} ${profile.last_name || ''}`.trim()
              : user.email?.split('@')[0] || 'User'

            localStorage.setItem('naybourhood_user', JSON.stringify({
              id: user.id,
              email: user.email,
              name: fullName,
              role: role,
              company_id: profile?.company_id,
            }))

            setIsRedirecting(true)
            navigateTo(`/${role === 'admin' ? 'admin' : role}`)
          }
        } catch (err) {
          console.error('[Login] Auth check error:', err)
        }
      }
      checkSupabaseAuth()
    }
  }, [supabaseConfigured])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (supabaseConfigured) {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (error) {
          setError(error.message)
        } else {
          setMagicLinkSent(true)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNavigating) return
    setError('')
    setIsLoading(true)

    try {
      if (supabaseConfigured) {
        const supabase = createClient()

        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({ email, password })

          if (error) {
            setError(error.message)
          } else if (data.user) {
            if (data.user.identities?.length === 0) {
              setError('An account with this email already exists. Please sign in instead.')
            } else {
              if (!data.session) {
                localStorage.setItem('naybourhood_email_pending', 'true')
              }
              setIsRedirecting(true)
              navigateTo('/onboarding')
            }
          }
        } else {
          // Sign in with password
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })

          if (error) {
            setError(error.message === 'Invalid login credentials'
              ? 'Invalid email or password. Please try again.'
              : error.message)
          } else if (data.user) {
            // Get profile for role - single query
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('user_type, first_name, last_name, company_id, onboarding_completed')
              .eq('id', data.user.id)
              .single()

            if (!profile?.onboarding_completed) {
              setIsRedirecting(true)
              navigateTo('/onboarding')
              return
            }

            let role = profile?.user_type || 'developer'
            if (isMasterAdmin(data.user.email)) {
              role = 'admin'
            }

            const fullName = profile?.first_name
              ? `${profile.first_name} ${profile.last_name || ''}`.trim()
              : data.user.email?.split('@')[0] || 'User'

            // Save to localStorage FIRST
            localStorage.setItem('naybourhood_user', JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: fullName,
              role: role,
              company_id: profile?.company_id,
            }))

            // Navigate immediately
            setIsRedirecting(true)
            navigateTo(`/${role === 'admin' ? 'admin' : role}`)

            // Update profile status in background (fire and forget)
            supabase
              .from('user_profiles')
              .update({ membership_status: 'active' })
              .eq('id', data.user.id)
              .then(() => {})
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      if (!isNavigating) {
        setIsLoading(false)
      }
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (supabaseConfigured) {
        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        })

        if (error) {
          setError(error.message)
        } else {
          setResetEmailSent(true)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick Access handler - INSTANT navigation
  const handleQuickAccess = (role: string) => {
    if (isNavigating) return

    localStorage.setItem('naybourhood_user', JSON.stringify({
      id: 'master-admin-kofi',
      email: 'kofi@naybourhood.ai',
      name: 'Kofi Bartels-Kodwo',
      role: role,
      company: masterAdminCompany.name,
      company_id: masterAdminCompany.id,
      is_master_admin: true,
    }))

    setIsRedirecting(true)
    navigateTo(`/${role}`)
  }

  // Show loading spinner while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (resetEmailSent) {
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
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          <Button variant="outline" onClick={() => { setResetEmailSent(false); setIsForgotPassword(false); setEmail(''); }}>
            Back to login
          </Button>
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
          </div>
          <Button variant="outline" onClick={() => { setMagicLinkSent(false); setEmail(''); setPassword(''); }}>
            Use a different email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthHandler />
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <LogoIcon className="w-14 h-14 mx-auto" variant="light" />
          </Link>
          <h1 className="mt-4 font-display text-2xl font-medium">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? 'Get started with Naybourhood' : 'Sign in to your Naybourhood account'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Auth Card */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="password"><Lock className="w-4 h-4 mr-2" />Password</TabsTrigger>
                <TabsTrigger value="magic"><Mail className="w-4 h-4 mr-2" />Magic Link</TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                {isForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email address</label>
                      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Send Reset Link
                    </Button>
                    <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); }} className="w-full text-sm text-muted-foreground hover:text-foreground">
                      Back to login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordAuth} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email address</label>
                      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Password</label>
                        {!isSignUp && (
                          <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-xs text-primary hover:underline">
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email address</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send Magic Link
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    We&apos;ll email you a secure link to sign in — no password needed.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Toggle Sign Up / Sign In */}
        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>Already have an account?{' '}<button onClick={() => { setIsSignUp(false); setError(''); }} className="text-primary hover:underline">Sign in</button></>
          ) : (
            <>Don&apos;t have an account?{' '}<button onClick={() => { setIsSignUp(true); setError(''); }} className="text-primary hover:underline">Sign up</button></>
          )}
        </p>

        {/* Quick Access - Master Admin */}
        <Card className="border-dashed border-white/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-center text-white/50 mb-3 uppercase tracking-wider font-medium">
              Master Admin Access
            </p>
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-[#0A0A0A]">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Shield className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Kofi Bartels-Kodwo</p>
                <p className="text-xs text-amber-400">kofi@naybourhood.ai</p>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                SUPER ADMIN
              </span>
            </div>

            <div className="mb-3">
              <p className="text-xs text-white/50 mb-1.5">Select company:</p>
              <select
                value={masterAdminCompany.id}
                onChange={(e) => {
                  const company = MASTER_ADMIN_COMPANIES.find(c => c.id === e.target.value)
                  if (company) setMasterAdminCompany(company)
                }}
                className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {MASTER_ADMIN_COMPANIES.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-white/50 mb-2 text-center">Select dashboard:</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleQuickAccess('admin')} disabled={isNavigating} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-amber-500 text-[#0A0A0A] font-medium hover:bg-amber-400 transition-colors disabled:opacity-50">
                <Shield className="h-4 w-4" />Admin
              </button>
              <button onClick={() => handleQuickAccess('developer')} disabled={isNavigating} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                <HardHat className="h-4 w-4" />Developer
              </button>
              <button onClick={() => handleQuickAccess('agent')} disabled={isNavigating} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                <Users className="h-4 w-4" />Agent
              </button>
              <button onClick={() => handleQuickAccess('broker')} disabled={isNavigating} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                <Briefcase className="h-4 w-4" />Broker
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
