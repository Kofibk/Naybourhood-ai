import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Back',
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {children}
    </div>
  )
}
