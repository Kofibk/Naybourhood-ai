'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'

export default function MountAnvilLoginPage() {
  const router = useRouter()

  // Auto-redirect to demo dashboard
  useEffect(() => {
    router.replace('/mount-anvil-demo')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/50 text-sm mt-4">Redirecting to demo...</p>
      </div>
    </div>
  )
}
