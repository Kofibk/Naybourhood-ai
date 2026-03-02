'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SB_DEMO_USER } from '@/lib/demo-data-smartbricks'

/**
 * Smart Bricks Demo Entry Point — /sbricksdemo
 *
 * Sets up demo user in localStorage and redirects to the demo dashboard.
 */
export default function SBDemoPage() {
  const router = useRouter()

  useEffect(() => {
    const demoUser = {
      ...SB_DEMO_USER,
      role: 'developer',
      user_type: 'developer',
    }
    localStorage.setItem('naybourhood_user', JSON.stringify(demoUser))
    sessionStorage.setItem('naybourhood_skip_onboarding', 'true')

    router.replace('/sbricksdemo/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading Smart Bricks demo...</p>
      </div>
    </div>
  )
}
