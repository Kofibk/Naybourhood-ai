'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import { Building2, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'

export default function MountAnvilLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useMountAnvilDemo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/mount-anvil-demo')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push('/mount-anvil-demo')
    } else {
      setError(result.error || 'Login failed')
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo2026')
    setError('')
    setIsLoading(true)

    const result = await login(demoEmail, 'demo2026')

    if (result.success) {
      router.push('/mount-anvil-demo')
    } else {
      setError(result.error || 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">Naybourhood</h1>
            <p className="text-white/40 text-xs">Buyer Intelligence Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-sm">Powered by</span>
          <span className="text-white font-medium">Mount Anvil</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mount Anvil Branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl mb-6 shadow-2xl">
              <span className="text-white text-3xl font-bold tracking-tight">MA</span>
            </div>
            <h2 className="text-white text-3xl font-bold mb-2">Mount Anvil</h2>
            <p className="text-white/60">Sign in to your buyer intelligence dashboard</p>
          </div>

          {/* Login Form */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-white/70 text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@mountanvil.com"
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-white/70 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/50 text-sm text-center mb-4">Quick access demo accounts</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleDemoLogin('rowena@mountanvil.com')}
                  disabled={isLoading}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Rowena Chen</p>
                      <p className="text-white/50 text-sm">Sales Director</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
                <button
                  onClick={() => handleDemoLogin('jay@mountanvil.com')}
                  disabled={isLoading}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Jay Patel</p>
                      <p className="text-white/50 text-sm">Head of Marketing</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-sm mt-8">
            Demo environment for Mount Anvil pitch presentation
          </p>
        </div>
      </main>
    </div>
  )
}
