'use client'

import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function getScoreColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  return { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' }
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

export function ScoreBadge({ score, size = 'md', showLabel }: ScoreBadgeProps) {
  const colors = getScoreColor(score)

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold border',
          sizeClasses[size],
          colors.bg,
          colors.border,
          colors.text
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', colors.text)}>
          NB Score
        </span>
      )}
    </div>
  )
}
