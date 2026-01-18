'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PriorityAction } from '@/types'
import { NextActionChip } from '@/components/badges'
import {
  Target,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriorityActionsProps {
  actions: PriorityAction[]
  onComplete?: (actionId: string) => void
  onSnooze?: (actionId: string) => void
  onAction?: (action: PriorityAction) => void
  loading?: boolean
  className?: string
}

const urgencyStyles = {
  now: 'bg-red-500/10 border-red-500/30',
  today: 'bg-orange-500/10 border-orange-500/30',
  soon: 'bg-blue-500/10 border-blue-500/30',
}

const urgencyBadges = {
  now: { label: 'Now', variant: 'destructive' as const },
  today: { label: 'Today', variant: 'warning' as const },
  soon: { label: 'Soon', variant: 'secondary' as const },
}

const actionIcons = {
  call: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  book_viewing: Calendar,
  confirm: CheckCircle,
  follow_up: Clock,
  re_engage: RefreshCw,
}

export function PriorityActions({
  actions,
  onComplete,
  onSnooze,
  onAction,
  loading,
  className,
}: PriorityActionsProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const handleComplete = (actionId: string) => {
    setCompletedIds((prev) => new Set(prev).add(actionId))
    onComplete?.(actionId)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const visibleActions = actions.filter((a) => !completedIds.has(a.id))

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Priority Actions
          <span className="text-xs font-normal text-muted-foreground">
            ({visibleActions.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visibleActions.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleActions.map((action, index) => {
              const Icon = actionIcons[action.actionType] || Clock
              const urgency = urgencyBadges[action.urgency]

              return (
                <div
                  key={action.id}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    urgencyStyles[action.urgency]
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{action.leadName}</span>
                          <Badge variant="outline" className="text-[10px]">
                            Score: {action.score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <NextActionChip
                        action={action.actionType}
                        onClick={() => onAction?.(action)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleComplete(action.id)}
                        aria-label="Mark action as complete"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for agent dashboard
export function PriorityActionsCompact({
  actions,
  onComplete,
  onAction,
  className,
}: {
  actions: PriorityAction[]
  onComplete?: (actionId: string) => void
  onAction?: (action: PriorityAction) => void
  className?: string
}) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const handleComplete = (actionId: string) => {
    setCompletedIds((prev) => new Set(prev).add(actionId))
    onComplete?.(actionId)
  }

  const visibleActions = actions.filter((a) => !completedIds.has(a.id))

  return (
    <div className={cn('space-y-2', className)}>
      {visibleActions.map((action, index) => {
        const Icon = actionIcons[action.actionType] || Clock

        return (
          <div
            key={action.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="text-sm font-bold text-muted-foreground">{index + 1}.</span>
            <Icon className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{action.leadName}</div>
              <div className="text-xs text-muted-foreground truncate">{action.description}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onAction?.(action)}
              >
                {action.actionType === 'call' ? 'Call' : action.actionType === 'email' ? 'Email' : 'Action'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleComplete(action.id)}
                aria-label="Mark action as complete"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
