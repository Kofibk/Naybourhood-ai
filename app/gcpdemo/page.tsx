'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /gcpdemo — Entry point redirects to dashboard
 */
export default function GcpDemoEntry() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/gcpdemo/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading Aroundtown demo...</p>
      </div>
    </div>
  )
}
