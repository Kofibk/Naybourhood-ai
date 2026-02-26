'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DEMO_USER } from '@/lib/demo-data'

/**
 * Demo Entry Point — /demo
 *
 * Sets up demo user in localStorage and redirects to the demo dashboard.
 * Designed for investor and client presentations where no Supabase credentials are needed.
 *
 * Usage:
 *   Navigate to /demo to enter presentation mode
 */
export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Store demo user in localStorage
    const demoUser = {
      ...DEMO_USER,
      role: 'developer',
      user_type: 'developer',
    }
    localStorage.setItem('naybourhood_user', JSON.stringify(demoUser))
    sessionStorage.setItem('naybourhood_skip_onboarding', 'true')

    // Redirect to the self-contained demo dashboard (public route, no auth needed)
    router.replace('/demo/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading presentation mode...</p>
      </div>
    </div>
  )
}
