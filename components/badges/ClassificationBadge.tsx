'use client'

import { cn } from '@/lib/utils'
import { LeadClassification } from '@/types'
import { Flame, Thermometer, Snowflake, Sparkles, XCircle } from 'lucide-react'

interface ClassificationBadgeProps {
  classification: LeadClassification | string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const classificationStyles: Record<string, { bg: string; text: string; icon: typeof Flame; label: string }> = {
  Hot: {
    bg: 'bg-red-500 dark:bg-red-600',
    text: 'text-white',
    icon: Flame,
    label: 'Hot',
  },
  'Warm-Qualified': {
    bg: 'bg-orange-500 dark:bg-orange-600',
    text: 'text-white',
    icon: Thermometer,
    label: 'Warm-Qualified',
  },
  'Warm-Engaged': {
    bg: 'bg-amber-500 dark:bg-amber-600',
    text: 'text-white',
    icon: Thermometer,
    label: 'Warm-Engaged',
  },
  Warm: {
    bg: 'bg-orange-500 dark:bg-orange-600',
    text: 'text-white',
    icon: Thermometer,
    label: 'Warm',
  },
  Nurture: {
    bg: 'bg-blue-400 dark:bg-blue-500',
    text: 'text-white',
    icon: Sparkles,
    label: 'Nurture',
  },
  'Nurture-Premium': {
    bg: 'bg-blue-500 dark:bg-blue-600',
    text: 'text-white',
    icon: Sparkles,
    label: 'Nurture-Premium',
  },
  'Nurture-Standard': {
    bg: 'bg-blue-300 dark:bg-blue-400',
    text: 'text-white',
    icon: Sparkles,
    label: 'Nurture-Standard',
  },
  Cold: {
    bg: 'bg-gray-400 dark:bg-gray-600',
    text: 'text-white',
    icon: Snowflake,
    label: 'Cold',
  },
  Low: {
    bg: 'bg-gray-400 dark:bg-gray-600',
    text: 'text-white',
    icon: Snowflake,
    label: 'Low',
  },
  Disqualified: {
    bg: 'bg-gray-600 dark:bg-gray-700',
    text: 'text-white',
    icon: XCircle,
    label: 'Disqualified',
  },
  Spam: {
    bg: 'bg-gray-600 dark:bg-gray-700',
    text: 'text-white',
    icon: XCircle,
    label: 'Spam',
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
  const style = classificationStyles[classification] || classificationStyles['Cold']
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
      <span>{style.label}</span>
    </span>
  )
}

// Emoji-only version for compact display
export function ClassificationEmoji({ classification }: { classification: LeadClassification | string }) {
  const emojis: Record<string, string> = {
    Hot: '🔥',
    'Warm-Qualified': '🌡️',
    'Warm-Engaged': '🌡️',
    Warm: '🌡️',
    Nurture: '✨',
    'Nurture-Premium': '✨',
    'Nurture-Standard': '✨',
    Cold: '❄️',
    Low: '❄️',
    Disqualified: '🚫',
    Spam: '🚫',
  }

  return <span title={String(classification)}>{emojis[classification] || '❄️'}</span>
}
