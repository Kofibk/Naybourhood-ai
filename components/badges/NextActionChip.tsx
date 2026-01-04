'use client'

import { cn } from '@/lib/utils'
import { NextActionType } from '@/types'
import { Phone, Mail, MessageCircle, Calendar, CheckCircle, RefreshCw, Clock } from 'lucide-react'

interface NextActionChipProps {
  action: NextActionType | string
  onClick?: () => void
  className?: string
}

const actionConfig: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  call: {
    label: 'Call',
    icon: Phone,
    color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400',
  },
  email: {
    label: 'Email',
    icon: Mail,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  book_viewing: {
    label: 'Book',
    icon: Calendar,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  },
  confirm: {
    label: 'Confirm',
    icon: CheckCircle,
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  follow_up: {
    label: 'Follow Up',
    icon: Clock,
    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  },
  re_engage: {
    label: 'Re-engage',
    icon: RefreshCw,
    color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400',
  },
}

export function NextActionChip({ action, onClick, className }: NextActionChipProps) {
  const config = actionConfig[action] || actionConfig['follow_up']
  const Icon = config.icon

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
        config.color,
        onClick && 'cursor-pointer',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Component>
  )
}
