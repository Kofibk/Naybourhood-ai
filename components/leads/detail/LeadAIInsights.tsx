'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import { ScoreBreakdownSection } from '@/components/leads/detail/LeadDisplayComponents'
import {
  Phone,
  Mail,
  MessageCircle,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  BarChart3,
} from 'lucide-react'

interface LeadAIInsightsProps {
  lead: Buyer
  summary: string | undefined
  nextAction: string | undefined
  recommendations: string[]
  riskFlags: string[]
  scoreBreakdown: ScoreBuyerResponse['score_breakdown'] | undefined
  onShowEmailComposer: () => void
}

export function LeadAIInsights({
  lead,
  summary,
  nextAction,
  recommendations,
  riskFlags,
  scoreBreakdown,
  onShowEmailComposer,
}: LeadAIInsightsProps) {
  const [openBreakdown, setOpenBreakdown] = useState<string | null>('quality')

  return (
    <div className="space-y-4">
      {/* AI Summary */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <Bot className="w-4 h-4 text-primary" />
            AI Summary
          </h3>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed">
            {summary || 'No AI summary available. Click "Re-score with AI" to generate.'}
          </p>
        </div>
      </div>

      {/* Next Action */}
      <div className="bg-[#111111] border border-primary/50 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <Target className="w-4 h-4 text-primary" />
            Recommended Next Action
          </h3>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm font-medium mb-3">{nextAction || 'No action recommended'}</p>
          <div className="flex gap-2 flex-wrap">
            {lead.phone && (
              <Button size="sm" asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="w-4 h-4 mr-1" /> Call
                </a>
              </Button>
            )}
            {lead.email && (
              <Button size="sm" variant="outline" onClick={onShowEmailComposer}>
                <Mail className="w-4 h-4 mr-1" /> Email
              </Button>
            )}
            {lead.phone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank">
                  <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4 pb-2">
            <h3 className="text-base flex items-center gap-2 text-white">
              <Lightbulb className="w-4 h-4" />
              AI Recommendations
            </h3>
          </div>
          <div className="px-4 pb-4">
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <div className="bg-[#111111] border border-yellow-500/50 rounded-xl">
          <div className="p-4 pb-2">
            <h3 className="text-base flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              Risk Flags ({riskFlags.length})
            </h3>
          </div>
          <div className="px-4 pb-4">
            <ul className="space-y-1">
              {riskFlags.map((flag, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <BarChart3 className="w-4 h-4" />
            Score Breakdown
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {scoreBreakdown ? (
            (() => {
              // Cast to any to handle both Naybourhood (array) and legacy (object) formats
              const breakdown = scoreBreakdown as any
              return (
                <>
                  <ScoreBreakdownSection
                    title="Quality Score"
                    items={
                      Array.isArray(breakdown.quality?.breakdown)
                        ? breakdown.quality.breakdown.map((item: { factor: string; points: number; reason: string }) => ({
                            label: item.factor,
                            score: item.points,
                            maxScore: Math.abs(item.points) || 10,
                            details: [item.reason]
                          }))
                        : [
                            { label: 'Profile Completeness', ...breakdown.quality?.profileCompleteness },
                            { label: 'Financial Qualification', ...breakdown.quality?.financialQualification },
                            { label: 'Verification Status', ...breakdown.quality?.verificationStatus },
                            { label: 'Inventory Fit', ...breakdown.quality?.inventoryFit },
                          ].filter((item: any) => item.score !== undefined)
                    }
                    isOpen={openBreakdown === 'quality'}
                    onToggle={() => setOpenBreakdown(openBreakdown === 'quality' ? null : 'quality')}
                  />
                  <ScoreBreakdownSection
                    title="Intent Score"
                    items={
                      Array.isArray(breakdown.intent?.breakdown)
                        ? breakdown.intent.breakdown.map((item: { factor: string; points: number; reason: string }) => ({
                            label: item.factor,
                            score: item.points,
                            maxScore: Math.abs(item.points) || 10,
                            details: [item.reason]
                          }))
                        : [
                            { label: 'Timeline', ...breakdown.intent?.timeline },
                            { label: 'Purpose/Payment', ...breakdown.intent?.purpose },
                            { label: 'Engagement', ...breakdown.intent?.engagement },
                            { label: 'Commitment', ...breakdown.intent?.commitment },
                            { label: 'Negative Modifiers', ...breakdown.intent?.negativeModifiers },
                          ].filter((item: any) => item.score !== undefined)
                    }
                    isOpen={openBreakdown === 'intent'}
                    onToggle={() => setOpenBreakdown(openBreakdown === 'intent' ? null : 'intent')}
                  />
                  <ScoreBreakdownSection
                    title="Confidence Score"
                    items={
                      Array.isArray(breakdown.confidence?.breakdown)
                        ? breakdown.confidence.breakdown.map((item: { factor: string; points: number; reason: string }) => ({
                            label: item.factor,
                            score: item.points,
                            maxScore: Math.abs(item.points) || 10,
                            details: [item.reason]
                          }))
                        : [
                            { label: 'Data Completeness', ...breakdown.confidence?.dataCompleteness },
                            { label: 'Verification Level', ...breakdown.confidence?.verificationLevel },
                            { label: 'Engagement Data', ...breakdown.confidence?.engagementData },
                            { label: 'Transcript Quality', ...breakdown.confidence?.transcriptQuality },
                          ].filter((item: any) => item.score !== undefined)
                    }
                    isOpen={openBreakdown === 'confidence'}
                    onToggle={() => setOpenBreakdown(openBreakdown === 'confidence' ? null : 'confidence')}
                  />
                </>
              )
            })()
          ) : (
            <p className="text-sm text-white/50">Re-score to see detailed breakdown</p>
          )}
        </div>
      </div>
    </div>
  )
}
