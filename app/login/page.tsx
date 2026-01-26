'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoIcon } from '@/components/Logo'
import { AuthHandler } from '@/components/AuthHandler'
import { Loader2, Mail, Lock, CheckCircle, Eye, EyeOff, AlertCircle, Shield, HardHat, Users, Briefcase } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

// Master admin companies for quick access
const MASTER_ADMIN_COMPANIES = [
  { id: 'd4a3e617-422e-4c7e-a933-4214d534b927', name: 'Million Pound Homes' },
  { id: 'mount-anvil-001', name: 'Mount Anvil' },
  { id: 'ad165cde-0d30-4084-b798-063dabfa7e7b', name: 'Tudor Financial' },
]

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [masterAdminCompany, setMasterAdminCompany] = useState(MASTER_ADMIN_COMPANIES[0])
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabaseConfigured = isSupabaseConfigured()

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const errorType = searchParams.get('error_type')

    if (errorParam) {
      setError(errorParam)

      // If it's a PKCE error, auto-switch to password tab
      if (errorType === 'pkce') {
        // Clear the error params from URL without refresh
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        url.searchParams.delete('error_type')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }, [searchParams])

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (supabaseConfigured) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Update user status to 'active' since they're logged in
          await supabase
            .from('user_profiles')
            .update({ status: 'active' })
            .eq('id', user.id)

          // Check onboarding status
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!profile?.onboarding_completed) {
            router.push('/onboarding')
          } else {
            // Save user to localStorage before redirecting
            const role = profile.user_type || 'developer'
            const fullName = profile.first_name
              ? `${profile.first_name} ${profile.last_name || ''}`.trim()
              : user.email?.split('@')[0] || 'User'

            localStorage.setItem('naybourhood_user', JSON.stringify({
              id: user.id,
              email: user.email,
              name: fullName,
              role: role,
              company_id: profile.company_id,
            }))

            redirectBasedOnRole(role)
          }
        }
      }
    }
    checkAuth()
  }, [router, supabaseConfigured])

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'admin':
        router.push('/admin')
        break
      case 'agent':
        router.push('/agent')
        break
      case 'broker':
        router.push('/broker')
        break
      default:
        router.push('/developer')
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (supabaseConfigured) {
        const supabase = createClient()

        if (!supabase) {
          setError('Authentication service not available. Please try again later.')
          return
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            // Redirect to login page - AuthHandler will catch the hash fragment tokens
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
      console.error('[Auth] Magic link error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (supabaseConfigured) {
        const supabase = createClient()

        if (!supabase) {
          setError('Authentication service not available. Please try again later.')
          return
        }

        if (isSignUp) {
          // Sign up with password
          // Don't use emailRedirectTo - let Supabase use default token-based confirmation
          // which works across browsers (PKCE requires same browser)
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })

          if (error) {
            setError(error.message)
          } else if (data.user) {
            // Check if email confirmation is required
            if (data.user.identities?.length === 0) {
              setError('An account with this email already exists. Please sign in instead.')
            } else {
              // Always proceed to onboarding - email confirmation happens later in dashboard
              // Store that email needs confirmation for later prompting
              if (!data.session) {
                localStorage.setItem('naybourhood_email_pending', 'true')
              }
              router.push('/onboarding')
            }
          }
        } else {
          // Sign in with password
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            if (error.message === 'Invalid login credentials') {
              setError('Invalid email or password. Please try again.')
            } else {
              setError(error.message)
            }
          } else if (data.user) {
            // Update user status to 'active' on successful login
            await supabase
              .from('user_profiles')
              .update({ status: 'active' })
              .eq('id', data.user.id)

            // Check onboarding status
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (!profile?.onboarding_completed) {
              router.push('/onboarding')
            } else {
              // Save user to localStorage before redirecting
              const role = profile.user_type || 'developer'
              const fullName = profile.first_name
                ? `${profile.first_name} ${profile.last_name || ''}`.trim()
                : data.user.email?.split('@')[0] || 'User'

              localStorage.setItem('naybourhood_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: fullName,
                role: role,
                company_id: profile.company_id,
              }))

              redirectBasedOnRole(role)
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error('[Auth] Password auth error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (supabaseConfigured) {
        const supabase = createClient()

        if (!supabase) {
          setError('Authentication service not available. Please try again later.')
          return
        }

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
      console.error('[Auth] Forgot password error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Reset email sent confirmation
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
            <p className="text-sm text-muted-foreground">
              Click the link in your email to reset your password.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setResetEmailSent(false)
              setIsForgotPassword(false)
              setEmail('')
            }}
          >
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
              We&apos;ve sent {isSignUp ? 'a confirmation link' : 'a magic link'} to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to {isSignUp ? 'verify your account' : 'sign in'}.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setMagicLinkSent(false)
              setEmail('')
              setPassword('')
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

        {/* Global Error Alert */}
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
                <TabsTrigger value="password">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="magic">
                  <Mail className="w-4 h-4 mr-2" />
                  Magic Link
                </TabsTrigger>
              </TabsList>

              {/* Password Login/Signup */}
              <TabsContent value="password">
                {isForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
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
                      Send Reset Link
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false)
                        setError('')
                      }}
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                    >
                      Back to login
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordAuth} className="space-y-4">
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Password</label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true)
                              setError('')
                            }}
                            className="text-xs text-primary hover:underline"
                          >
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
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* Magic Link */}
              <TabsContent value="magic">
                <form onSubmit={handleMagicLink} className="space-y-4">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Toggle Sign Up / Sign In */}
        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(false)
                  setError('')
                }}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => {
                  setIsSignUp(true)
                  setError('')
                }}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </>
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

            {/* Company Selector */}
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
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-white/50 mb-2 text-center">Select dashboard:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('naybourhood_user', JSON.stringify({
                    id: 'master-admin-kofi',
                    email: 'kofi@naybourhood.ai',
                    name: 'Kofi Bartels-Kodwo',
                    role: 'admin',
                    company: masterAdminCompany.name,
                    company_id: masterAdminCompany.id,
                    is_master_admin: true,
                  }))
                  router.push('/admin')
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-amber-500 text-[#0A0A0A] font-medium hover:bg-amber-400 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('naybourhood_user', JSON.stringify({
                    id: 'master-admin-kofi',
                    email: 'kofi@naybourhood.ai',
                    name: 'Kofi Bartels-Kodwo',
                    role: 'developer',
                    company: masterAdminCompany.name,
                    company_id: masterAdminCompany.id,
                    is_master_admin: true,
                  }))
                  router.push('/developer')
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] text-white hover:bg-white/10 transition-colors"
              >
                <HardHat className="h-4 w-4" />
                Developer
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('naybourhood_user', JSON.stringify({
                    id: 'master-admin-kofi',
                    email: 'kofi@naybourhood.ai',
                    name: 'Kofi Bartels-Kodwo',
                    role: 'agent',
                    company: masterAdminCompany.name,
                    company_id: masterAdminCompany.id,
                    is_master_admin: true,
                  }))
                  router.push('/agent')
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] text-white hover:bg-white/10 transition-colors"
              >
                <Users className="h-4 w-4" />
                Agent
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('naybourhood_user', JSON.stringify({
                    id: 'master-admin-kofi',
                    email: 'kofi@naybourhood.ai',
                    name: 'Kofi Bartels-Kodwo',
                    role: 'broker',
                    company: masterAdminCompany.name,
                    company_id: masterAdminCompany.id,
                    is_master_admin: true,
                  }))
                  router.push('/broker')
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#0A0A0A] text-white hover:bg-white/10 transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                Broker
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
