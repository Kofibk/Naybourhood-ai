'use client'

import { MorningPriority } from '@/components/dashboard/MorningPriority'
import { SB_DEMO_USER, SB_DEMO_COMPANY } from '@/lib/demo-data-smartbricks'

export default function SBDemoDashboardPage() {
  return (
    <div className="space-y-6">
      <MorningPriority
        userType="developer"
        userName={SB_DEMO_USER.name.split(' ')[0]}
        companyId={SB_DEMO_COMPANY.id}
        companyName={SB_DEMO_COMPANY.name}
        planBadge="Growth"
      />
    </div>
  )
}
