'use client'

import { cn } from '@/lib/utils'

interface NBScoreHeroProps {
  qualityScore: number | null | undefined
  intentScore: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  className?: string
}

function getNBScore(quality: number | null | undefined, intent: number | null | undefined): number | null {
  const q = quality ?? null
  const i = intent ?? null
  if (q === null && i === null) return null
  return Math.round(((q ?? 0) + (i ?? 0)) / 2)
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 45) return 'text-amber-600'
  return 'text-gray-500'
}

function getBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-500'
  return 'bg-gray-400'
}

const sizeConfig = {
  sm: { score: 'text-lg', label: 'text-[10px]', bar: 'h-1', wrapper: '' },
  md: { score: 'text-2xl', label: 'text-xs', bar: 'h-1.5', wrapper: '' },
  lg: { score: 'text-4xl', label: 'text-sm', bar: 'h-2', wrapper: 'min-w-[100px]' },
}

export function NBScoreHero({
  qualityScore,
  intentScore,
  size = 'md',
  showBreakdown = false,
  className,
}: NBScoreHeroProps) {
  const nbScore = getNBScore(qualityScore, intentScore)
  const config = sizeConfig[size]

  if (nbScore === null) {
    return (
      <div className={cn('text-center', config.wrapper, className)}>
        <div className={cn(config.score, 'font-bold text-muted-foreground')}>--</div>
        <div className={cn(config.label, 'text-muted-foreground uppercase tracking-wider')}>
          NB Score
        </div>
      </div>
    )
  }

  const percentage = Math.min(100, Math.max(0, nbScore))

  return (
    <div className={cn('text-center', config.wrapper, className)}>
      <div className={cn(config.score, 'font-bold', getScoreColor(nbScore))}>
        {nbScore}
      </div>
      <div className={cn(config.label, 'text-muted-foreground uppercase tracking-wider')}>
        NB Score
      </div>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden mt-1', config.bar)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', getBarColor(nbScore))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showBreakdown && (
        <div className="flex items-center justify-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>Q: {qualityScore ?? '-'}</span>
          <span>I: {intentScore ?? '-'}</span>
        </div>
      )}
    </div>
  )
}

/** Compact inline NB Score for table cells */
export function NBScoreInline({
  qualityScore,
  intentScore,
  className,
}: {
  qualityScore: number | null | undefined
  intentScore: number | null | undefined
  className?: string
}) {
  const nbScore = getNBScore(qualityScore, intentScore)
  if (nbScore === null) {
    return <span className={cn('text-sm text-muted-foreground', className)}>--</span>
  }
  return (
    <span className={cn('text-sm font-bold', getScoreColor(nbScore), className)}>
      {nbScore}
    </span>
  )
}

export { getNBScore }
