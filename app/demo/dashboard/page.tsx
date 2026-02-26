'use client'

import { useEffect, useState } from 'react'
import { MorningPriority } from '@/components/dashboard/MorningPriority'
import { DEMO_USER, DEMO_COMPANY } from '@/lib/demo-data'

export default function DemoDashboardPage() {
  const [userName, setUserName] = useState(DEMO_USER.name)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('naybourhood_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.name) setUserName(parsed.name)
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="space-y-6">
      <MorningPriority
        userType="developer"
        userName={userName.split(' ')[0]}
        companyId={DEMO_COMPANY.id}
        companyName={DEMO_COMPANY.name}
        planBadge="Pro"
      />
    </div>
  )
}
