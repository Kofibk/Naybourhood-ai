'use client'

import { Badge } from '@/components/ui/badge'

interface CampaignHealthBadgeProps {
  score: number | undefined | null
  showLabel?: boolean
}

export function CampaignHealthBadge({ score, showLabel = true }: CampaignHealthBadgeProps) {
  if (score === undefined || score === null) {
    return showLabel ? (
      <Badge variant="outline" className="text-muted-foreground">
        Not analyzed
      </Badge>
    ) : null
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-green-500', text: 'text-green-500', label: '🟢' }
    if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: '🟡' }
    return { bg: 'bg-red-500', text: 'text-red-500', label: '🔴' }
  }

  const health = getHealthColor(score)

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{health.label}</span>
      <span className={`font-medium ${health.text}`}>{score}</span>
    </div>
  )
}
