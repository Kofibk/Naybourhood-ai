'use client'

import * as React from 'react'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'warning' | 'info' | 'secondary' | 'destructive' | 'success' | 'default' | 'muted'

const statusVariantMap: Record<string, StatusVariant> = {
  'Contact Pending': 'warning',
  'Follow Up': 'info',
  'Viewing Booked': 'secondary',
  'Negotiating': 'warning',
  'Reserved': 'success',
  'Exchanged': 'success',
  'Completed': 'success',
  'Not Proceeding': 'destructive',
  'Disqualified': 'muted',
  'Duplicate': 'muted',
  // Generic statuses
  'active': 'success',
  'inactive': 'muted',
  'pending': 'warning',
  'paid': 'success',
  'overdue': 'destructive',
  'failed': 'destructive',
  'trialing': 'info',
  'past_due': 'warning',
  'cancelled': 'muted',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusVariantMap[status] || statusVariantMap[status.toLowerCase()] || 'secondary'

  return (
    <Badge variant={variant} className={cn('text-xs', className)}>
      {status}
    </Badge>
  )
}
