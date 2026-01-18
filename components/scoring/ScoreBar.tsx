'use client'

import { cn } from '@/lib/utils'

interface ScoreBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ScoreBar({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  className,
}: ScoreBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-red-500'
    if (score >= 45) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-medium">{value}</span>}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', getColor(value))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
