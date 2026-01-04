'use client'

import { cn } from '@/lib/utils'
import { PaymentMethod } from '@/types'
import { Banknote, Building } from 'lucide-react'

interface PaymentBadgeProps {
  method: PaymentMethod | string | undefined
  showIcon?: boolean
  className?: string
}

const paymentStyles: Record<string, { bg: string; icon: typeof Banknote }> = {
  Cash: {
    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: Banknote,
  },
  Mortgage: {
    bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Building,
  },
}

export function PaymentBadge({ method, showIcon = true, className }: PaymentBadgeProps) {
  const normalizedMethod = method?.toLowerCase() === 'cash' ? 'Cash' : 'Mortgage'
  const style = paymentStyles[normalizedMethod]
  const Icon = style.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        style.bg,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{normalizedMethod}</span>
    </span>
  )
}
