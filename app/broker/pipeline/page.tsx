'use client'

import { PipelineBoard } from '@/components/dashboard/PipelineBoard'
import { GitBranch } from 'lucide-react'

export default function BrokerPipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-primary" />
          Borrower Pipeline
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Drag and drop borrowers between stages to update their status
        </p>
      </div>
      <PipelineBoard userType="broker" />
    </div>
  )
}
