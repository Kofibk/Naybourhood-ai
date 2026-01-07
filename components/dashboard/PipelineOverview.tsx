'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PipelineStats } from '@/types'
import { cn } from '@/lib/utils'
import {
  Clock,
  PhoneCall,
  Eye,
  MessageSquare,
  CheckCircle,
  FileCheck,
  Trophy,
  XCircle,
  Copy,
} from 'lucide-react'

interface PipelineOverviewProps {
  stats: PipelineStats
  onStageClick?: (stage: keyof PipelineStats) => void
  loading?: boolean
  className?: string
}

const stageConfig: Record<
  keyof PipelineStats,
  { label: string; icon: typeof Clock; color: string }
> = {
  contactPending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  followUp: {
    label: 'Follow',
    icon: PhoneCall,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  viewingBooked: {
    label: 'View.',
    icon: Eye,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  negotiating: {
    label: 'Negot.',
    icon: MessageSquare,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  reserved: {
    label: 'Reserv.',
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  exchanged: {
    label: 'Exch.',
    icon: FileCheck,
    color: 'bg-green-600/10 text-green-700 border-green-600/20',
  },
  completed: {
    label: 'Done',
    icon: Trophy,
    color: 'bg-green-700/10 text-green-800 border-green-700/20',
  },
  notProceeding: {
    label: 'Lost',
    icon: XCircle,
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  disqualified: {
    label: 'DQ',
    icon: Copy,
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  },
}

// Main stages to show (hide duplicate/notProceeding in main view)
const mainStages: (keyof PipelineStats)[] = [
  'contactPending',
  'followUp',
  'viewingBooked',
  'negotiating',
  'reserved',
]

export function PipelineOverview({
  stats,
  onStageClick,
  loading,
  className,
}: PipelineOverviewProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = Object.values(stats).reduce((sum, val) => sum + val, 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Pipeline Overview</CardTitle>
          <span className="text-xs text-muted-foreground">{total} total leads</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {mainStages.map((stage) => {
            const config = stageConfig[stage]
            const Icon = config.icon
            const count = stats[stage]

            return (
              <button
                key={stage}
                onClick={() => onStageClick?.(stage)}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:scale-105',
                  config.color
                )}
              >
                <Icon className="h-5 w-5 mb-2" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-[10px] font-medium opacity-80">{config.label}</div>
              </button>
            )
          })}
        </div>

        {/* Secondary stats row */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-green-600">{stats.exchanged + stats.completed}</span>{' '}
            completed
          </span>
          <span>
            <span className="font-medium text-red-600">{stats.notProceeding}</span> lost
          </span>
          <span>
            <span className="font-medium text-gray-600">{stats.disqualified}</span> disqualified
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for sidebars
export function PipelineCompact({
  stats,
  onStageClick,
}: {
  stats: PipelineStats
  onStageClick?: (stage: keyof PipelineStats) => void
}) {
  return (
    <div className="space-y-2">
      {mainStages.map((stage) => {
        const config = stageConfig[stage]
        const count = stats[stage]

        return (
          <button
            key={stage}
            onClick={() => onStageClick?.(stage)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm text-muted-foreground">{config.label}</span>
            <span className="font-medium">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
