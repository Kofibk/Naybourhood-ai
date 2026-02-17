'use client'

import { OutcomeSummary } from '@/components/dashboard/OutcomeSummary'
import { BarChart3 } from 'lucide-react'

export default function BrokerOutcomesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          Outcome Tracking
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Track completions, fall-throughs, and scoring accuracy
        </p>
      </div>
      <OutcomeSummary userType="broker" />
    </div>
  )
}
