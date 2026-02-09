'use client'

import { Badge } from '@/components/ui/badge'
import {
  TRANSACTION_STAGES,
  STAGE_LABELS,
  FALL_THROUGH_LABELS,
} from '@/types/transactions'
import type {
  TransactionStage,
  FallThroughReason,
  BuyerTransaction,
} from '@/types/transactions'
import { ArrowRight, Check, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StagePipelineProps {
  transaction: BuyerTransaction
}

const STAGE_COLORS: Record<string, string> = {
  enquiry: 'bg-blue-500',
  viewing: 'bg-purple-500',
  offer: 'bg-amber-500',
  reservation: 'bg-orange-500',
  exchange: 'bg-emerald-500',
  completion: 'bg-green-600',
  fallen_through: 'bg-red-500',
}

export function StagePipeline({ transaction }: StagePipelineProps) {
  const currentStage = transaction.current_stage
  const isFallenThrough = currentStage === 'fallen_through'

  const fallStageIndex =
    isFallenThrough && transaction.fall_through_stage
      ? TRANSACTION_STAGES.indexOf(
          transaction.fall_through_stage as (typeof TRANSACTION_STAGES)[number]
        )
      : -1

  return (
    <div className="space-y-3">
      {/* Stage Pipeline Visual */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {TRANSACTION_STAGES.map((stage, i) => {
          const stageIndex = TRANSACTION_STAGES.indexOf(
            currentStage as (typeof TRANSACTION_STAGES)[number]
          )
          const isPast = !isFallenThrough && i < stageIndex
          const isCurrent = !isFallenThrough && stage === currentStage
          const isFuture = !isFallenThrough && i > stageIndex
          const wasPastBeforeFall = isFallenThrough && i < fallStageIndex
          const wasStageBeforeFall = isFallenThrough && i === fallStageIndex

          return (
            <div key={stage} className="flex items-center gap-1 shrink-0">
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                  isCurrent && `${STAGE_COLORS[stage]} text-white`,
                  isPast && 'bg-green-600/20 text-green-400',
                  isFuture && 'bg-muted text-muted-foreground',
                  wasPastBeforeFall && 'bg-red-500/20 text-red-400',
                  wasStageBeforeFall &&
                    'bg-red-500/30 text-red-400 ring-1 ring-red-500/50',
                  isFallenThrough &&
                    i > fallStageIndex &&
                    'bg-muted text-muted-foreground'
                )}
              >
                {isPast || wasPastBeforeFall ? (
                  <Check className="h-3 w-3" />
                ) : isCurrent ? (
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                ) : wasStageBeforeFall ? (
                  <XCircle className="h-3 w-3" />
                ) : null}
                {STAGE_LABELS[stage]}
              </div>
              {i < TRANSACTION_STAGES.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Fall Through Info */}
      {isFallenThrough && transaction.fall_through_reason && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              Fell through at{' '}
              {STAGE_LABELS[
                transaction.fall_through_stage as TransactionStage
              ] || transaction.fall_through_stage}
            </span>
          </div>
          <p className="text-xs text-red-400/80 mt-1">
            Reason:{' '}
            {FALL_THROUGH_LABELS[
              transaction.fall_through_reason as FallThroughReason
            ] || transaction.fall_through_reason}
          </p>
        </div>
      )}
    </div>
  )
}
