'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { Skeleton } from './skeleton'

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'inline'
  text?: string
  className?: string
  /** Number of skeleton rows for 'skeleton' variant */
  rows?: number
}

export function LoadingState({
  variant = 'spinner',
  text,
  className,
  rows = 3,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {text || 'Loading...'}
      </span>
    )
  }

  // Default: spinner
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
