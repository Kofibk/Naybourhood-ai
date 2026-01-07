'use client'

import { cn } from '@/lib/utils'
import { LeadClassification } from '@/types'
import { ClassificationBadge } from '@/components/badges'
import { ScoreBar } from './ScoreBar'

interface ScoreDisplayProps {
  qualityScore: number
  intentScore: number
  classification: LeadClassification
  confidence?: number
  showBars?: boolean
  showClassification?: boolean
  layout?: 'horizontal' | 'vertical' | 'compact'
  className?: string
}

export function ScoreDisplay({
  qualityScore,
  intentScore,
  classification,
  confidence,
  showBars = true,
  showClassification = true,
  layout = 'horizontal',
  className,
}: ScoreDisplayProps) {
  if (layout === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm font-medium">{qualityScore}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm">{intentScore}</span>
        {showClassification && (
          <ClassificationBadge classification={classification} size="sm" showIcon={false} />
        )}
      </div>
    )
  }

  if (layout === 'vertical') {
    return (
      <div className={cn('space-y-3', className)}>
        {showClassification && (
          <div className="flex justify-center">
            <ClassificationBadge classification={classification} size="lg" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{qualityScore}</div>
            <div className="text-xs text-muted-foreground">Quality</div>
            {showBars && <ScoreBar value={qualityScore} size="sm" showValue={false} className="mt-2" />}
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{intentScore}</div>
            <div className="text-xs text-muted-foreground">Intent</div>
            {showBars && <ScoreBar value={intentScore} size="sm" showValue={false} className="mt-2" />}
          </div>
        </div>
        {confidence !== undefined && (
          <div className="text-center text-xs text-muted-foreground">
            AI Confidence: {Math.round(confidence * 100)}%
          </div>
        )}
      </div>
    )
  }

  // Horizontal layout (default)
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-lg font-bold">{qualityScore}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Quality</div>
          {showBars && <ScoreBar value={qualityScore} size="sm" showValue={false} className="w-12 mt-1" />}
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{intentScore}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Intent</div>
          {showBars && <ScoreBar value={intentScore} size="sm" showValue={false} className="w-12 mt-1" />}
        </div>
      </div>
      {showClassification && <ClassificationBadge classification={classification} />}
      {confidence !== undefined && (
        <span className="text-xs text-muted-foreground">
          {Math.round(confidence * 100)}% conf.
        </span>
      )}
    </div>
  )
}

// Mini version for table cells
export function ScoreCell({ quality, intent }: { quality: number; intent: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="font-medium">{quality}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{intent}</span>
    </div>
  )
}
