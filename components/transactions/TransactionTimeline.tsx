'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useTransaction } from '@/hooks/useTransactions'
import { StagePipeline } from './StagePipeline'
import { StageHistory } from './StageHistory'
import { TRANSACTION_STAGES, STAGE_LABELS } from '@/types/transactions'
import type { TransactionStage, FallThroughReason } from '@/types/transactions'
import { ArrowRight, XCircle, Clock, Plus } from 'lucide-react'

interface TransactionTimelineProps {
  buyerId: string
  developmentId?: string
  companyId?: string
  className?: string
}

const FALL_THROUGH_OPTIONS: { value: FallThroughReason; label: string }[] = [
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'finance_failed', label: 'Finance Failed' },
  { value: 'found_elsewhere', label: 'Found Elsewhere' },
  { value: 'chain_broke', label: 'Chain Broke' },
  { value: 'other', label: 'Other' },
]

export function TransactionTimeline({
  buyerId,
  developmentId,
  companyId,
  className,
}: TransactionTimelineProps) {
  const {
    transaction,
    isLoading,
    isCreating,
    isAdvancing,
    isFallingThrough,
    createTransaction,
    advanceStage,
    markFallThrough,
  } = useTransaction(buyerId)

  const [advanceNotes, setAdvanceNotes] = useState('')
  const [showAdvanceForm, setShowAdvanceForm] = useState(false)
  const [showFallThrough, setShowFallThrough] = useState(false)
  const [fallThroughReason, setFallThroughReason] = useState<FallThroughReason | ''>('')
  const [fallThroughNotes, setFallThroughNotes] = useState('')

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Transaction Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            No transaction tracking started for this buyer.
          </p>
          <Button
            size="sm"
            onClick={() => createTransaction(developmentId, companyId)}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isCreating ? 'Starting...' : 'Start Tracking'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentStage = transaction.current_stage
  const isTerminal = currentStage === 'fallen_through' || currentStage === 'completion'
  const currentIndex = TRANSACTION_STAGES.indexOf(
    currentStage as (typeof TRANSACTION_STAGES)[number]
  )
  const nextStage =
    !isTerminal && currentIndex < TRANSACTION_STAGES.length - 1
      ? TRANSACTION_STAGES[currentIndex + 1]
      : null

  const handleAdvance = async () => {
    if (!nextStage) return
    await advanceStage(transaction.id, nextStage, advanceNotes || undefined)
    setAdvanceNotes('')
    setShowAdvanceForm(false)
  }

  const handleFallThrough = async () => {
    if (!fallThroughReason) return
    await markFallThrough(transaction.id, fallThroughReason, fallThroughNotes || undefined)
    setFallThroughReason('')
    setFallThroughNotes('')
    setShowFallThrough(false)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Transaction Pipeline
          {currentStage === 'fallen_through' && (
            <Badge variant="destructive" className="text-xs">Fallen Through</Badge>
          )}
          {currentStage === 'completion' && (
            <Badge className="bg-green-600 text-white text-xs">Completed</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StagePipeline transaction={transaction} />

        {!isTerminal && (
          <div className="flex flex-wrap gap-2">
            {nextStage && (
              <Button
                size="sm"
                onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                disabled={isAdvancing}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                {isAdvancing ? 'Advancing...' : `Advance to ${STAGE_LABELS[nextStage]}`}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowFallThrough(!showFallThrough)}
              disabled={isFallingThrough}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Fallen Through
            </Button>
          </div>
        )}

        {showAdvanceForm && nextStage && (
          <div className="p-3 rounded-lg border space-y-2">
            <p className="text-xs font-medium">Advance to {STAGE_LABELS[nextStage]}</p>
            <Textarea
              value={advanceNotes}
              onChange={(e) => setAdvanceNotes(e.target.value)}
              placeholder="Add notes (optional)..."
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdvance} disabled={isAdvancing}>
                {isAdvancing ? 'Advancing...' : 'Confirm'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdvanceForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {showFallThrough && (
          <div className="p-3 rounded-lg border border-red-500/20 space-y-2">
            <p className="text-xs font-medium text-red-400">Mark as Fallen Through</p>
            <select
              value={fallThroughReason}
              onChange={(e) => setFallThroughReason(e.target.value as FallThroughReason)}
              className="w-full h-9 px-3 border rounded-md bg-background text-sm"
            >
              <option value="">Select reason...</option>
              {FALL_THROUGH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Textarea
              value={fallThroughNotes}
              onChange={(e) => setFallThroughNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleFallThrough}
                disabled={!fallThroughReason || isFallingThrough}
              >
                {isFallingThrough ? 'Updating...' : 'Confirm Fall Through'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowFallThrough(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <StageHistory history={transaction.stage_history} />
      </CardContent>
    </Card>
  )
}
