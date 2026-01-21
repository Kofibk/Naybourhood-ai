'use client'

import { cn } from '@/lib/utils'
import { LeadStatus } from '@/types'

interface StatusBadgeProps {
  status: LeadStatus | string
  className?: string
}

const statusStyles: Record<string, string> = {
  'Contact Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  'Follow Up': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  'Viewing Booked': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
  'Negotiating': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
  'Reserved': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  'Exchanged': 'bg-green-200 text-green-900 border-green-400 dark:bg-green-800/40 dark:text-green-300 dark:border-green-600',
  'Completed': 'bg-green-300 text-green-900 border-green-500 dark:bg-green-700/50 dark:text-green-200 dark:border-green-500',
  'Not Proceeding': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  'Duplicate': 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles['Contact Pending']

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
        style,
        className
      )}
    >
      {status}
    </span>
  )
}
