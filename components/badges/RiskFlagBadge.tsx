'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskFlagBadgeProps {
  flag: string
  className?: string
}

export function RiskFlagBadge({ flag, className }: RiskFlagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        'bg-yellow-100 text-yellow-800 border-yellow-300',
        'dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
        className
      )}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[200px]">{flag}</span>
    </span>
  )
}

/** Render a list of risk flags as inline badges */
export function RiskFlagList({ flags, className }: { flags: string[]; className?: string }) {
  if (!flags || flags.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {flags.map((flag, i) => (
        <RiskFlagBadge key={i} flag={flag} />
      ))}
    </div>
  )
}
