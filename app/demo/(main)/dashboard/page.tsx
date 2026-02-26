'use client'

import { MorningPriority } from '@/components/dashboard/MorningPriority'
import { DEMO_USER, DEMO_COMPANY } from '@/lib/demo-data'

export default function DemoDashboardPage() {
  return (
    <div className="space-y-6">
      <MorningPriority
        userType="developer"
        userName={DEMO_USER.name.split(' ')[0]}
        companyId={DEMO_COMPANY.id}
        companyName={DEMO_COMPANY.name}
        planBadge="Growth"
      />
    </div>
  )
}
