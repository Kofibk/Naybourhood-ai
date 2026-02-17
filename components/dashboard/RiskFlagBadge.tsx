'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RiskFlagBadgeProps {
  flag: string
  size?: 'sm' | 'md'
}

function getFlagConfig(flag: string): { icon: string; color: string } {
  const lower = flag.toLowerCase()

  if (lower.includes('fake') || lower.includes('fraud') || lower.includes('spam')) {
    return { icon: '', color: 'bg-red-500/15 text-red-400 border-red-500/30' }
  }
  if (lower.includes('finance') || lower.includes('fund') || lower.includes('mortgage')) {
    return { icon: '', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
  }
  if (lower.includes('time') || lower.includes('visa') || lower.includes('urgent')) {
    return { icon: '', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' }
  }
  if (lower.includes('duplicate') || lower.includes('existing')) {
    return { icon: '', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' }
  }

  return { icon: '', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
}

export function RiskFlagBadge({ flag, size = 'md' }: RiskFlagBadgeProps) {
  const config = getFlagConfig(flag)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border font-medium',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {flag}
    </span>
  )
}
