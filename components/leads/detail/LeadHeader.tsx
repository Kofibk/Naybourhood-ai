'use client'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { ScoreIndicator } from '@/components/ui/score-indicator'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import {
  ClassificationBadge,
  PriorityBadge,
} from '@/components/leads/detail/LeadDisplayComponents'
import {
  Phone,
  Mail,
  Globe,
  Archive,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react'

interface LeadHeaderProps {
  lead: Buyer
  qualityScore: number | null | undefined
  intentScore: number | null | undefined
  confidenceScore: number | null
  classification: string
  priority: string
  scoreReasons: string[]
  scoreResult: ScoreBuyerResponse | null
  isRescoring: boolean
  onRescore: () => void
  onArchive: () => void
}

export function LeadHeader({
  lead,
  qualityScore,
  intentScore,
  confidenceScore,
  classification,
  priority,
  scoreReasons,
  scoreResult,
  isRescoring,
  onRescore,
  onArchive,
}: LeadHeaderProps) {
  const leadName = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'

  return (
    <div className="space-y-4">
      <PageHeader
        title={leadName}
        backHref="/admin/leads"
        backLabel="Back to Leads"
        actions={
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive className="w-4 h-4 mr-1" /> Archive
          </Button>
        }
      >
        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="w-4 h-4" /> {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="w-4 h-4" /> {lead.phone}
            </a>
          )}
          {lead.country && (
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" /> {lead.country}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Score Cards Row */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreIndicator value={qualityScore} label="Quality Score" size="lg" />
        <ScoreIndicator value={intentScore} label="Intent Score" size="lg" />
        <ScoreIndicator
          value={confidenceScore !== null ? Math.round(confidenceScore) : null}
          max={100}
          label="Confidence"
          size="lg"
        />
        <ClassificationBadge classification={classification} showExplanation />
      </div>

      {/* Priority + Rescore */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <PriorityBadge priority={priority} showExplanation />
        <Button variant="default" onClick={onRescore} disabled={isRescoring}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRescoring ? 'animate-spin' : ''}`} />
          {isRescoring ? 'Scoring...' : 'Re-score with AI'}
        </Button>
      </div>

      {/* Score Reasons Summary */}
      {scoreReasons.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Why these scores?
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {scoreReasons.map((reason, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-1">
                <span className="text-primary">•</span> {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Spam Warning */}
      {scoreResult?.is_spam && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Potential Spam Detected</h4>
            <ul className="text-sm text-red-700 mt-1">
              {scoreResult.spam_flags.map((flag, i) => (
                <li key={i}>• {flag}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
