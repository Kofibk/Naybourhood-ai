'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import {
  ScoreCard,
  ClassificationBadge,
  PriorityBadge,
} from '@/components/leads/detail/LeadDisplayComponents'
import {
  ArrowLeft,
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
  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onArchive}>
            <Archive className="w-4 h-4 mr-1" /> Archive
          </Button>
        </div>
      </div>

      {/* Lead Name & Contact */}
      <div>
        <h1 className="text-3xl font-bold">
          {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
        </h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground mt-1">
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
      </div>

      {/* Score Cards Row */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreCard
          label="Quality Score"
          score={qualityScore}
          explanation="How qualified is this lead?"
        />
        <ScoreCard
          label="Intent Score"
          score={intentScore}
          explanation="How ready to buy?"
        />
        <ScoreCard
          label="Confidence"
          score={confidenceScore !== null ? Math.round(confidenceScore) : null}
          maxScore={100}
          explanation="AI certainty level"
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
