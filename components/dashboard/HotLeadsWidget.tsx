'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lead } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { NextActionChip, ClassificationBadge } from '@/components/badges'
import { NBScoreInline } from '@/components/scoring/NBScoreHero'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Flame, ChevronRight, Phone, MessageCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HotLeadsWidgetProps {
  leads: Lead[]
  onViewAll?: () => void
  onLeadClick?: (lead: Lead) => void
  onQuickAction?: (leadId: string, action: string) => void
  loading?: boolean
  className?: string
}

export function HotLeadsWidget({
  leads,
  onViewAll,
  onLeadClick,
  onQuickAction,
  loading,
  className,
}: HotLeadsWidgetProps) {
  // Determine next action for a lead
  const getNextAction = (lead: Lead): string => {
    if (lead.status === 'Contact Pending') return 'call'
    if (lead.status === 'Follow Up') return lead.daysInStatus && lead.daysInStatus > 3 ? 're_engage' : 'email'
    if (lead.status === 'Viewing Booked') return 'confirm'
    if (lead.viewingIntentConfirmed && !lead.viewingBooked) return 'book_viewing'
    return 'follow_up'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-500" />
            Hot Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState variant="skeleton" rows={3} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-500" />
            Hot Leads
            <span className="text-xs font-normal text-muted-foreground">({leads.length})</span>
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onViewAll}>
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <EmptyState icon={Flame} title="No hot leads found" className="py-4" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">NB</th>
                  <th className="pb-2 font-medium">Class</th>
                  <th className="pb-2 font-medium">Budget</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Next</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onLeadClick?.(lead)}
                  >
                    <td className="py-2">
                      <div className="font-medium">{lead.fullName}</div>
                    </td>
                    <td className="py-2">
                      <NBScoreInline qualityScore={lead.qualityScore} intentScore={lead.intentScore} />
                    </td>
                    <td className="py-2">
                      <ClassificationBadge classification={lead.classification} size="sm" showIcon={false} />
                    </td>
                    <td className="py-2">
                      <div className="text-xs">{lead.budgetRange || 'N/A'}</div>
                    </td>
                    <td className="py-2">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-2" onClick={(e) => e.stopPropagation()}>
                      <NextActionChip
                        action={getNextAction(lead)}
                        onClick={() => onQuickAction?.(lead.id, getNextAction(lead))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mini version for sidebar
export function HotLeadsMini({
  leads,
  onLeadClick,
  className,
}: {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {leads.slice(0, 5).map((lead) => (
        <button
          key={lead.id}
          onClick={() => onLeadClick?.(lead)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div>
            <div className="text-sm font-medium">{lead.fullName}</div>
            <div className="text-xs text-muted-foreground">{lead.budgetRange}</div>
          </div>
          <NBScoreInline qualityScore={lead.qualityScore} intentScore={lead.intentScore} />
        </button>
      ))}
    </div>
  )
}
