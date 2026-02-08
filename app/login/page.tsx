'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogoIcon } from '@/components/Logo'
import { AuthHandler } from '@/components/AuthHandler'
import { Loader2, Mail, Lock, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isMasterAdmin, MASTER_ADMIN_EMAILS, getDashboardPathForRole, buildDisplayName } from '@/lib/auth'

// Explicit columns for user_profiles queries on login page
const LOGIN_PROFILE_COLUMNS = 'id, email, user_type, first_name, last_name, company_id, onboarding_completed, permission_role, membership_status'

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
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

  const redirectBasedOnRole = useCallback((role: string) => {
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
  }, [router])

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (supabaseConfigured) {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Update user status to 'active' since they're logged in
            await supabase
              .from('user_profiles')
              .update({ membership_status: 'active' })
              .eq('id', user.id)

            // Check onboarding status with explicit columns
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select(LOGIN_PROFILE_COLUMNS)
              .eq('id', user.id)
              .single()

            console.log('[Login] Auth check profile:', { profile, error: profileError?.message })

            // Only redirect to onboarding if we got a profile AND it explicitly has onboarding_completed = false
            // If profile is null (RLS or not found), don't redirect to onboarding - show login instead
            if (profile && profile.onboarding_completed === false) {
              router.push('/onboarding')
            } else if (profile) {
              // Save user to localStorage before redirecting
              let role = profile.user_type || 'developer'

              // Master admin email override (using centralized auth config)
              if (isMasterAdmin(user.email)) {
                role = 'admin'
              }

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
            // If profile is null, fall through to show login form
          }
        }
      } catch (err) {
        console.error('[Login] Auth check error:', err)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router, supabaseConfigured, redirectBasedOnRole])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('[Login] 📧 Requesting magic link via API (cross-browser compatible):', {
        email,
        origin: window.location.origin,
      })

      // Use our custom API endpoint that generates token_hash based links
      // These work cross-browser (no PKCE required)
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      console.log('[Login] 📧 Magic link API response:', {
        success: response.ok,
        status: response.status,
        data,
      })

      if (!response.ok) {
        setError(data.error || 'Failed to send magic link')
      } else {
        console.log('[Login] ✅ Magic link sent via admin API (works in ANY browser)')
        setMagicLinkSent(true)
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
          console.log('[Signup] 🆕 Starting signup process for:', email)
          // Sign up with password
          // Don't use emailRedirectTo - let Supabase use default token-based confirmation
          // which works across browsers (PKCE requires same browser)
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })

          console.log('[Signup] Supabase signUp response:', { 
            hasUser: !!data.user, 
            hasSession: !!data.session,
            userId: data.user?.id,
            identitiesLength: data.user?.identities?.length,
            error: error?.message 
          })

          if (error) {
            console.error('[Signup] ❌ Signup error:', error)
            setError(error.message)
          } else if (data.user) {
            // Check if email confirmation is required
            if (data.user.identities?.length === 0) {
              console.warn('[Signup] ⚠️ Email already exists')
              setError('An account with this email already exists. Please sign in instead.')
            } else {
              console.log('[Signup] ✅ User created successfully')
              // Always proceed to onboarding - email confirmation happens later in dashboard
              // Store that email needs confirmation for later prompting
              if (!data.session) {
                console.log('[Signup] ⚠️ No session returned - email confirmation required')
                localStorage.setItem('naybourhood_email_pending', 'true')
              } else {
                console.log('[Signup] ✅ Session created immediately')
              }
              console.log('[Signup] → Redirecting to onboarding')
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
              .update({ membership_status: 'active' })
              .eq('id', data.user.id)

            // Check onboarding status with explicit columns
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select(LOGIN_PROFILE_COLUMNS)
              .eq('id', data.user.id)
              .single()

            console.log('[Login] Sign-in profile:', { profile, error: profileError?.message })

            if (profile && profile.onboarding_completed === false) {
              router.push('/onboarding')
            } else if (profile) {
              // Save user to localStorage before redirecting
              let role = profile.user_type || 'developer'

              // Master admin email override (using centralized auth config)
              if (isMasterAdmin(data.user.email)) {
                role = 'admin'
              }

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

  // Show loading spinner while checking if user is already authenticated
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
