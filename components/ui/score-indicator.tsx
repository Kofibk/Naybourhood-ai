'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScoreIndicatorProps {
  value: number | null | undefined
  max?: number
  label?: string
  showBar?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-500'
  return 'bg-gray-400'
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 45) return 'text-amber-500'
  return 'text-gray-400'
}

const sizeConfig = {
  sm: { bar: 'h-1', text: 'text-sm', label: 'text-[10px]' },
  md: { bar: 'h-2', text: 'text-lg', label: 'text-xs' },
  lg: { bar: 'h-3', text: 'text-2xl', label: 'text-sm' },
}

export function ScoreIndicator({
  value,
  max = 100,
  label,
  showBar = true,
  size = 'md',
  className,
}: ScoreIndicatorProps) {
  const displayValue = value ?? 0
  const percentage = Math.min(100, Math.max(0, (displayValue / max) * 100))
  const config = sizeConfig[size]

  if (value === null || value === undefined) {
    return (
      <div className={cn('text-center', className)}>
        <div className={cn(config.text, 'font-bold text-muted-foreground')}>--</div>
        {label && (
          <div className={cn(config.label, 'text-muted-foreground uppercase tracking-wider')}>
            {label}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('text-center', className)}>
      <div className={cn(config.text, 'font-bold', getScoreTextColor(displayValue))}>
        {displayValue}
      </div>
      {label && (
        <div className={cn(config.label, 'text-muted-foreground uppercase tracking-wider')}>
          {label}
        </div>
      )}
      {showBar && (
        <div className={cn('w-full bg-muted rounded-full overflow-hidden mt-1', config.bar)}>
          <div
            className={cn('h-full rounded-full transition-all duration-300', getScoreColor(displayValue))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

/** Compact score pair for table cells */
export function ScorePair({
  quality,
  intent,
  className,
}: {
  quality: number
  intent: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <span className={cn('font-medium', getScoreTextColor(quality))}>{quality}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{intent}</span>
    </div>
  )
}
