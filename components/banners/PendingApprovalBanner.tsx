'use client'

import { Clock } from 'lucide-react'

export function PendingApprovalBanner() {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="font-medium text-amber-500">Pending approval</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your account is being reviewed. Once approved, you&apos;ll have full access to your company&apos;s leads and campaigns.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This usually takes less than 24 hours
          </p>
        </div>
      </div>
    </div>
  )
}

export default PendingApprovalBanner
