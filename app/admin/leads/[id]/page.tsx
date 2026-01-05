'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Edit,
  Archive,
  RefreshCw,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  User,
  BarChart3,
  Building,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
} from 'lucide-react'

// Status options
const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Fake',
  'Cant Verify',
  'Duplicate',
]

// Classification colors and labels
const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'Hot': { bg: 'bg-red-500', text: 'text-white', label: 'Hot' },
  'Warm-Qualified': { bg: 'bg-orange-500', text: 'text-white', label: 'Warm (Qualified)' },
  'Warm-Engaged': { bg: 'bg-amber-500', text: 'text-white', label: 'Warm (Engaged)' },
  'Nurture-Premium': { bg: 'bg-blue-500', text: 'text-white', label: 'Nurture (Premium)' },
  'Nurture-Standard': { bg: 'bg-blue-400', text: 'text-white', label: 'Nurture' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold' },
  'Disqualified': { bg: 'bg-gray-600', text: 'text-white', label: 'Disqualified' },
  'Spam': { bg: 'bg-red-700', text: 'text-white', label: 'Spam' },
}

const PRIORITY_CONFIG: Record<string, { bg: string; label: string; time: string }> = {
  'P1': { bg: 'bg-red-100 text-red-800 border-red-300', label: 'P1 - Urgent', time: '< 1 hour' },
  'P2': { bg: 'bg-orange-100 text-orange-800 border-orange-300', label: 'P2 - High', time: '< 4 hours' },
  'P3': { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'P3 - Medium', time: '< 24 hours' },
  'P4': { bg: 'bg-gray-100 text-gray-800 border-gray-300', label: 'P4 - Low', time: '48+ hours' },
}

// Boolean Indicator Component
function BooleanIndicator({ value }: { value: boolean | undefined | null }) {
  return value ? (
    <span className="text-green-500 flex items-center gap-1">
      <CheckCircle className="h-4 w-4" /> Yes
    </span>
  ) : (
    <span className="text-red-500 flex items-center gap-1">
      <XCircle className="h-4 w-4" /> No
    </span>
  )
}

// Score Card with Progress Bar
function ScoreCard({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100
  const getColor = (p: number) => {
    if (p >= 70) return 'bg-green-500'
    if (p >= 45) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  return (
    <div className="border rounded-lg p-3 min-w-[120px] bg-card">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{score}{maxScore !== 100 && <span className="text-sm text-muted-foreground">/{maxScore}</span>}</div>
      <div className="w-full h-2 bg-muted rounded-full mt-1">
        <div
          className={`h-2 rounded-full transition-all ${getColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Classification Badge
function ClassificationBadge({ classification, size = 'sm' }: { classification: string; size?: 'sm' | 'lg' }) {
  const config = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-lg' : 'px-3 py-1.5 text-sm'

  return (
    <span className={`rounded-lg font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  )
}

// Priority Badge
function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['P4']

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg}`}>
      <Clock className="w-4 h-4" />
      <span className="font-medium">{config.label}</span>
      <span className="text-xs opacity-75">({config.time})</span>
    </div>
  )
}

// Payment Badge
function PaymentBadge({ method }: { method: string | undefined | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>
  const isCash = method === 'Cash'
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${isCash ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
      {method} {isCash && '✓'}
    </span>
  )
}

// Score Breakdown Component
function ScoreBreakdown({
  title,
  breakdown,
  isOpen,
  onToggle
}: {
  title: string
  breakdown: { score: number; maxScore: number; details: string[] }[]
  isOpen: boolean
  onToggle: () => void
}) {
  const total = breakdown.reduce((sum, b) => sum + b.score, 0)
  const maxTotal = breakdown.reduce((sum, b) => sum + b.maxScore, 0)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">({total}/{maxTotal})</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-3 space-y-3">
          {breakdown.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{getBreakdownLabel(title, i)}</span>
                <span className="font-medium">{item.score}/{item.maxScore}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                />
              </div>
              {item.details.length > 0 && (
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {item.details.map((d, j) => (
                    <li key={j}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getBreakdownLabel(title: string, index: number): string {
  if (title === 'Quality Score') {
    return ['Profile Completeness', 'Financial Qualification', 'Verification Status', 'Inventory Fit'][index] || ''
  }
  if (title === 'Intent Score') {
    return ['Timeline', 'Purpose', 'Engagement', 'Commitment', 'Negative Modifiers'][index] || ''
  }
  if (title === 'Confidence Score') {
    return ['Data Completeness', 'Verification Level', 'Engagement Data', 'Transcript Quality'][index] || ''
  }
  return ''
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { leads, users, isLoading, updateLead, refreshData } = useData()

  const [isRescoring, setIsRescoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreBuyerResponse | null>(null)
  const [openBreakdown, setOpenBreakdown] = useState<string | null>(null)
  const [hasAutoScored, setHasAutoScored] = useState(false)

  const lead = useMemo(() => {
    return leads.find((l) => l.id === params.id)
  }, [leads, params.id])

  const handleStatusChange = async (status: string) => {
    if (!lead) return
    await updateLead(lead.id, { status })
  }

  const handleAssigneeChange = async (assignee: string) => {
    if (!lead) return
    await updateLead(lead.id, { assigned_to: assignee })
  }

  const handleRescore = async () => {
    if (!lead) return

    setIsRescoring(true)
    try {
      const response = await fetch('/api/ai/score-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: lead.id })
      })

      if (response.ok) {
        const result = await response.json() as ScoreBuyerResponse
        setScoreResult(result)
        // Refresh data to get updated lead
        await refreshData()
      } else {
        const errorData = await response.json()
        console.error('[LeadDetail] Score API error:', errorData)
      }
    } catch (error) {
      console.error('Failed to score lead:', error)
    } finally {
      setIsRescoring(false)
    }
  }

  // Auto-score lead if it doesn't have scores yet
  useEffect(() => {
    const shouldAutoScore = lead &&
      !hasAutoScored &&
      !isRescoring &&
      !scoreResult &&
      !lead.ai_scored_at &&
      (lead.ai_quality_score === 0 || lead.ai_quality_score === undefined) &&
      (lead.quality_score === 0 || lead.quality_score === undefined)

    if (shouldAutoScore) {
      console.log('[LeadDetail] Auto-scoring lead:', lead.id)
      setHasAutoScored(true)
      // Delay to avoid race conditions
      setTimeout(() => {
        handleRescore()
      }, 500)
    }
  }, [lead, hasAutoScored, isRescoring, scoreResult])

  const handleArchive = async () => {
    if (!lead || !confirm('Archive this lead?')) return
    await updateLead(lead.id, { status: 'Not Proceeding' })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Show scoring indicator if auto-scoring on first load
  if (isRescoring && !scoreResult) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-lg font-medium mb-2">AI is analyzing this lead...</h3>
            <p className="text-muted-foreground">Generating quality score, intent score, and recommendations</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Lead not found</h3>
            <p className="text-muted-foreground mb-4">The lead you are looking for does not exist.</p>
            <Button onClick={() => router.push('/admin/leads')}>Back to Leads</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use score result if available, otherwise use stored values
  const qualityScore = scoreResult?.quality_score ?? lead.ai_quality_score ?? lead.quality_score ?? 0
  const intentScore = scoreResult?.intent_score ?? lead.ai_intent_score ?? lead.intent_score ?? 0
  const confidenceScore = scoreResult?.confidence ?? (lead.ai_confidence ? lead.ai_confidence * 10 : 0)
  const classification = scoreResult?.classification ?? lead.ai_classification ?? 'Cold'
  const priority = scoreResult?.priority ?? lead.ai_priority ?? 'P4'
  const summary = scoreResult?.summary ?? lead.ai_summary
  const nextAction = scoreResult?.next_action ?? lead.ai_next_action
  const riskFlags = scoreResult?.risk_flags ?? lead.ai_risk_flags ?? []
  const recommendations = scoreResult?.recommendations ?? lead.ai_recommendations ?? []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/leads/${lead.id}/edit`)}>
              <Edit className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-1" /> Archive
            </Button>
          </div>
        </div>

        {/* Lead Info */}
        <div>
          <h1 className="text-2xl font-bold">
            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
          </h1>
          <p className="text-muted-foreground">
            {lead.email || '-'} · {lead.phone || '-'} · {lead.country || '-'}
          </p>
        </div>

        {/* Score Cards Row */}
        <div className="flex gap-4 items-center flex-wrap">
          <ScoreCard label="Quality" score={qualityScore} />
          <ScoreCard label="Intent" score={intentScore} />
          <ScoreCard label="Confidence" score={confidenceScore} maxScore={10} />
          <ClassificationBadge classification={classification} size="lg" />
        </div>

        {/* Priority + Rescore */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <PriorityBadge priority={priority} />
          <Button variant="outline" size="sm" onClick={handleRescore} disabled={isRescoring}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isRescoring ? 'animate-spin' : ''}`} />
            {isRescoring ? 'Scoring...' : 'Re-score with AI'}
          </Button>
        </div>

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

      {/* ═══════════════════════════════════════════════════════════════════
          TWO COLUMN LAYOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─────────────────────────────────────────────────────────────────
            LEFT COLUMN - AI INSIGHTS
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* AI Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary || 'No AI summary available. Click "Re-score with AI" to generate.'}
              </p>
            </CardContent>
          </Card>

          {/* Next Action */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Next Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{nextAction || 'No action recommended'}</p>
              {nextAction && (
                <Button size="sm">
                  <Zap className="w-4 h-4 mr-1" /> Do It
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations yet. Re-score to generate.</p>
              )}
            </CardContent>
          </Card>

          {/* Risk Flags */}
          {riskFlags.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Flags ({riskFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {riskFlags.map((flag, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          {scoreResult?.score_breakdown && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ScoreBreakdown
                  title="Quality Score"
                  breakdown={[
                    scoreResult.score_breakdown.quality.profileCompleteness,
                    scoreResult.score_breakdown.quality.financialQualification,
                    scoreResult.score_breakdown.quality.verificationStatus,
                    scoreResult.score_breakdown.quality.inventoryFit,
                  ]}
                  isOpen={openBreakdown === 'quality'}
                  onToggle={() => setOpenBreakdown(openBreakdown === 'quality' ? null : 'quality')}
                />
                <ScoreBreakdown
                  title="Intent Score"
                  breakdown={[
                    scoreResult.score_breakdown.intent.timeline,
                    scoreResult.score_breakdown.intent.purpose,
                    scoreResult.score_breakdown.intent.engagement,
                    scoreResult.score_breakdown.intent.commitment,
                    scoreResult.score_breakdown.intent.negativeModifiers,
                  ]}
                  isOpen={openBreakdown === 'intent'}
                  onToggle={() => setOpenBreakdown(openBreakdown === 'intent' ? null : 'intent')}
                />
                <ScoreBreakdown
                  title="Confidence Score"
                  breakdown={[
                    scoreResult.score_breakdown.confidence.dataCompleteness,
                    scoreResult.score_breakdown.confidence.verificationLevel,
                    scoreResult.score_breakdown.confidence.engagementData,
                    scoreResult.score_breakdown.confidence.transcriptQuality,
                  ]}
                  isOpen={openBreakdown === 'confidence'}
                  onToggle={() => setOpenBreakdown(openBreakdown === 'confidence' ? null : 'confidence')}
                />
              </CardContent>
            </Card>
          )}

          {/* Viewing */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Viewing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intent Confirmed</span>
                <BooleanIndicator value={lead.status === 'Viewing Booked' || lead.status === 'Negotiating'} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Viewing Booked</span>
                <BooleanIndicator value={lead.status === 'Viewing Booked'} />
              </div>
              {lead.status !== 'Viewing Booked' && (
                <Button size="sm" className="w-full mt-2" onClick={() => handleStatusChange('Viewing Booked')}>
                  Book Viewing
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Communication History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.notes ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <div className="bg-muted rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-sans">{lead.notes}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No communication history</p>
              )}
              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                {lead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="w-4 h-4 mr-1" /> Call
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="w-4 h-4 mr-1" /> Email
                    </a>
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
            </CardContent>
          </Card>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            RIGHT COLUMN - BUYER DATA
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Buyer Profile */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Buyer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span>{lead.budget_range || lead.budget || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                <PaymentBadge method={lead.payment_method} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mortgage Status</span>
                <span>{lead.mortgage_status || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bedrooms</span>
                <span>{lead.preferred_bedrooms || lead.bedrooms || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span>{lead.location || lead.area || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Timeline</span>
                <span>{lead.timeline || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Country</span>
                <span>{lead.country || '-'}</span>
              </div>

              <div className="border-t border-border my-3" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Proof of Funds</span>
                <BooleanIndicator value={lead.proof_of_funds} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">UK Broker</span>
                <BooleanIndicator value={lead.uk_broker} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">UK Solicitor</span>
                <BooleanIndicator value={lead.uk_solicitor} />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Status Dropdown */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <select
                  value={lead.status || ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Dropdown */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Assigned</span>
                <select
                  value={lead.assigned_to || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border my-2" />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Development</span>
                <span>{lead.campaign || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span>{lead.source || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date Added</span>
                <span>{formatDate(lead.date_added || lead.created_at)}</span>
              </div>
              {lead.ai_scored_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Scored</span>
                  <span>{formatDate(lead.ai_scored_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Contact</span>
                <span>{formatDate(lead.last_contact)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(lead.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Broker */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4" />
                Broker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Connected</span>
                <BooleanIndicator value={lead.uk_broker} />
              </div>
              {!lead.uk_broker && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => updateLead(lead.id, { uk_broker: true })}
                >
                  Refer to Broker
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
