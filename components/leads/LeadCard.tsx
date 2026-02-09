'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lead } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { ClassificationBadge, PaymentBadge, NextActionChip, RiskFlagList } from '@/components/badges'
import { NBScoreInline } from '@/components/scoring/NBScoreHero'
import { Phone, MessageCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  onQuickAction?: (action: string) => void
  selected?: boolean
  className?: string
}

export function LeadCard({ lead, onClick, onQuickAction, selected, className }: LeadCardProps) {
  // Determine next action
  const getNextAction = (): string => {
    if (lead.status === 'Contact Pending') return 'call'
    if (lead.status === 'Follow Up') return lead.daysInStatus && lead.daysInStatus > 3 ? 're_engage' : 'email'
    if (lead.status === 'Viewing Booked') return 'confirm'
    if (lead.viewingIntentConfirmed && !lead.viewingBooked) return 'book_viewing'
    return 'follow_up'
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with NB Score Hero + Classification */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-medium">{lead.fullName}</div>
            <div className="text-xs text-muted-foreground">{lead.phone}</div>
          </div>
          <div className="flex items-center gap-2">
            <NBScoreInline qualityScore={lead.qualityScore} intentScore={lead.intentScore} />
            <ClassificationBadge classification={lead.classification} size="sm" />
          </div>
        </div>

        {/* Risk Flags */}
        {lead.aiRiskFlags && lead.aiRiskFlags.length > 0 && (
          <div className="mb-3">
            <RiskFlagList flags={lead.aiRiskFlags.slice(0, 2)} />
          </div>
        )}

        {/* Budget & Payment */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">{lead.budgetRange || 'Budget N/A'}</span>
          {lead.paymentMethod && <PaymentBadge method={lead.paymentMethod} showIcon={false} />}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={lead.status} />
          {lead.assignedCaller && (
            <span className="text-xs text-muted-foreground">{lead.assignedCaller}</span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <NextActionChip action={getNextAction()} />
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuickAction?.('call')}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuickAction?.('whatsapp')}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuickAction?.('book_viewing')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Grid of lead cards
export function LeadCardGrid({
  leads,
  onCardClick,
  onQuickAction,
  selectedIds,
  className,
}: {
  leads: Lead[]
  onCardClick?: (lead: Lead) => void
  onQuickAction?: (leadId: string, action: string) => void
  selectedIds?: Set<string>
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onClick={() => onCardClick?.(lead)}
          onQuickAction={(action) => onQuickAction?.(lead.id, action)}
          selected={selectedIds?.has(lead.id)}
        />
      ))}
    </div>
  )
}
