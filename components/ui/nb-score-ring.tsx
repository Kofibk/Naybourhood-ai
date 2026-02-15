'use client'

import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { cn } from '@/lib/utils'

interface NBScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
}

export function NBScoreRing({
  score,
  size = 72,
  strokeWidth = 6,
  className,
  label,
}: NBScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (Math.min(100, Math.max(0, score)) / 100) * circumference
  const color = getNBScoreColor(score)

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Score number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-bold"
          style={{
            color,
            fontSize: size > 60 ? size * 0.28 : size * 0.32,
          }}
        >
          {score}
        </span>
      </div>
      {label && (
        <span className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  )
}
