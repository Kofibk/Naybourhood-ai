'use client'

import { cn } from '@/lib/utils'
import { Flame, Target, AlertCircle, Clock, ChevronDown } from 'lucide-react'

interface ClassificationPillProps {
  classification: string
  size?: 'sm' | 'md'
}

const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; icon: typeof Flame }> = {
  'Hot Lead': { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: Flame },
  'Hot': { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: Flame },
  'Qualified': { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: Target },
  'Needs Qualification': { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', icon: AlertCircle },
  'Nurture': { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', icon: Clock },
  'Low Priority': { bg: 'bg-zinc-500/15 border-zinc-500/30', text: 'text-zinc-400', icon: ChevronDown },
}

export function ClassificationPill({ classification, size = 'md' }: ClassificationPillProps) {
  const config = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Low Priority']
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {classification}
    </span>
  )
}
