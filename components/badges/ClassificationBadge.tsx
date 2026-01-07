'use client'

import { cn } from '@/lib/utils'
import { LeadClassification } from '@/types'
import { Flame, Thermometer, Snowflake } from 'lucide-react'

interface ClassificationBadgeProps {
  classification: LeadClassification
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const classificationStyles: Record<LeadClassification, { bg: string; text: string; icon: typeof Flame }> = {
  Hot: {
    bg: 'bg-red-500 dark:bg-red-600',
    text: 'text-white',
    icon: Flame,
  },
  Warm: {
    bg: 'bg-orange-500 dark:bg-orange-600',
    text: 'text-white',
    icon: Thermometer,
  },
  Low: {
    bg: 'bg-gray-400 dark:bg-gray-600',
    text: 'text-white',
    icon: Snowflake,
  },
}

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

const iconSizes = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
}

export function ClassificationBadge({
  classification,
  showIcon = true,
  size = 'md',
  className,
}: ClassificationBadgeProps) {
  const style = classificationStyles[classification]
  const Icon = style.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        style.bg,
        style.text,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{classification}</span>
    </span>
  )
}

// Emoji-only version for compact display
export function ClassificationEmoji({ classification }: { classification: LeadClassification }) {
  const emojis: Record<LeadClassification, string> = {
    Hot: '🔥',
    Warm: '🌡️',
    Low: '❄️',
  }

  return <span title={classification}>{emojis[classification]}</span>
}
