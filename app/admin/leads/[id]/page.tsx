'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { useUsers } from '@/hooks/useUsers'
import { useLeads } from '@/hooks/useLeads'
import { EmailComposer } from '@/components/EmailComposer'
import { ConversationThread } from '@/components/ConversationThread'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import { parseBudgetRange, formatBudgetValue, formatDate } from '@/lib/leadUtils'
import { DataRow } from '@/components/leads/detail/LeadDisplayComponents'
import { EditableTextField, EditableBooleanField, EditableSelectField, EditableConnectionStatus } from '@/components/leads/detail/LeadEditableFields'
import { LeadSidebar } from '@/components/leads/detail/LeadSidebar'
import { KycVerificationBanner } from '@/components/kyc/KycVerificationBanner'
import {
  ArrowLeft, Phone, Mail, MessageCircle, Calendar, Bot, MessageSquare,
  User, Building, Clock, DollarSign, MapPin, Hash, Globe, Briefcase, Home,
  Target, Sparkles, Shield, ShieldCheck, ExternalLink, TrendingUp,
  CircleDot, CheckCircle, FileText, RefreshCw, ShieldAlert, AlertTriangle,
} from 'lucide-react'

// ─── Helper Components ───────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, accentColor }: { title: string; icon: any; children: React.ReactNode; accentColor?: string }) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentColor || 'text-white/50'}`} />
          {title}
        </h3>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

function SubScoreBar({ label, score, maxScore = 100 }: { label: string; score: number | null | undefined; maxScore?: number }) {
  const value = score ?? 0
  const percentage = Math.min((value / maxScore) * 100, 100)
  const color = getNBScoreColor(value)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{score ?? '-'}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ─── Classification Config ───────────────────────────────────────────────────

const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string; ringBg: string }> = {
  'Hot': { bg: 'bg-red-600', text: 'text-white', label: 'Hot Lead', ringBg: 'bg-red-500/10 border-red-500/30' },
  'Hot Lead': { bg: 'bg-red-600', text: 'text-white', label: 'Hot Lead', ringBg: 'bg-red-500/10 border-red-500/30' },
  'Qualified': { bg: 'bg-emerald-600', text: 'text-white', label: 'Qualified', ringBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Warm-Qualified': { bg: 'bg-emerald-600', text: 'text-white', label: 'Qualified', ringBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Needs Qualification': { bg: 'bg-amber-500', text: 'text-white', label: 'Needs Qualification', ringBg: 'bg-amber-500/10 border-amber-500/30' },
  'Warm-Engaged': { bg: 'bg-amber-500', text: 'text-white', label: 'Warm', ringBg: 'bg-amber-500/10 border-amber-500/30' },
  'Nurture': { bg: 'bg-blue-500', text: 'text-white', label: 'Nurture', ringBg: 'bg-blue-500/10 border-blue-500/30' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold', ringBg: 'bg-gray-400/10 border-gray-400/30' },
  'Disqualified': { bg: 'bg-red-900', text: 'text-white', label: 'Disqualified', ringBg: 'bg-red-900/10 border-red-900/30' },
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { leads, isLoading: leadsLoading, updateLead, refreshLeads } = useLeads()
  const { users } = useUsers()
  const isLoading = leadsLoading
  const refreshData = refreshLeads

  const [isRescoring, setIsRescoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreBuyerResponse | null>(null)
  const [hasAutoScored, setHasAutoScored] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)

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

  const handleRescore = useCallback(async () => {
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
        console.log('[LeadDetail] Score result:', result)
        setScoreResult(result)
        await refreshData()
      } else {
        const errorData = await response.json()
        console.error('[LeadDetail] Score API error:', errorData)
        alert(`Scoring failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to score lead:', error)
      alert('Failed to score lead. Check console for details.')
    } finally {
      setIsRescoring(false)
    }
  }, [lead, refreshData])

  // Auto-score lead if it doesn't have scores yet
  useEffect(() => {
    // Early return if lead doesn't exist
    if (!lead) return

    // Check if lead is unscored (null means unscored, 0 is a valid score)
    const isUnscored = (lead.ai_quality_score === null || lead.ai_quality_score === undefined) &&
                       (lead.quality_score === null || lead.quality_score === undefined) &&
                       !lead.ai_scored_at

    const shouldAutoScore = !hasAutoScored &&
      !isRescoring &&
      !scoreResult &&
      isUnscored

    if (shouldAutoScore) {
      console.log('[LeadDetail] Auto-scoring lead:', lead.id)
      setHasAutoScored(true)
      setTimeout(() => {
        handleRescore()
      }, 500)
    }
  }, [lead, hasAutoScored, isRescoring, scoreResult, handleRescore])

  const handleArchive = async () => {
    if (!lead || !confirm('Archive this lead?')) return
    await updateLead(lead.id, { status: 'Not Proceeding' })
  }

  // Generic field save handler for editable fields
  const handleFieldSave = async (field: string, value: string | boolean | number | null) => {
    if (!lead) return
    await updateLead(lead.id, { [field]: value })
  }

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/50">Loading...</p>
      </div>
    )
  }

  // Show scoring indicator if auto-scoring on first load
  if (isRescoring && !scoreResult) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-lg font-medium text-white mb-2">AI is analyzing this lead...</h3>
            <p className="text-white/50">Generating quality score, intent score, and recommendations</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Not Found State ────────────────────────────────────────────────────────

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Lead not found</h3>
            <p className="text-white/50 mb-4">The lead you are looking for does not exist.</p>
            <Button onClick={() => router.push('/admin/leads')}>Back to Leads</Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Score Computation ──────────────────────────────────────────────────────

  // Use score result if available, otherwise use stored values
  // Use null for unscored leads (will trigger auto-scoring)
  const qualityScore = scoreResult?.quality_score ?? lead.final_score ?? lead.ai_quality_score ?? lead.quality_score
  const intentScore = scoreResult?.intent_score ?? lead.ai_intent_score ?? lead.intent_score
  // ai_confidence is stored as 0-100 (e.g., 30 means 30%)
  const confidenceScore = scoreResult?.confidence ?? lead.ai_confidence ?? null
  const classification = scoreResult?.classification ?? lead.ai_classification ?? 'Cold'
  const priority = scoreResult?.priority ?? lead.ai_priority ?? 'P4'
  const summary = scoreResult?.summary ?? lead.ai_summary
  const nextAction = scoreResult?.next_action ?? lead.ai_next_action
  const riskFlags = scoreResult?.risk_flags ?? lead.ai_risk_flags ?? []
  const recommendations = scoreResult?.recommendations ?? lead.ai_recommendations ?? []
  const scoreBreakdown = scoreResult?.score_breakdown

  // Helper to check if broker/solicitor has positive status
  const hasPositiveConnection = (status: string | boolean | undefined | null): boolean => {
    if (typeof status === 'boolean') return status
    return status === 'yes' || status === 'introduced'
  }

  // Generate explanation for why scores are what they are
  const getScoreExplanation = () => {
    const reasons: string[] = []

    // Quality factors
    if (lead.payment_method?.toLowerCase() === 'cash') reasons.push('Cash buyer (+15 quality)')
    if (lead.proof_of_funds) reasons.push('Proof of funds verified (+10 quality)')
    if (hasPositiveConnection(lead.uk_broker)) reasons.push('UK Broker connected (+8 quality)')
    if (hasPositiveConnection(lead.uk_solicitor)) reasons.push('UK Solicitor in place (+7 quality)')
    if (!lead.email && !lead.phone) reasons.push('Missing contact info (-10 quality)')

    // Intent factors
    if (lead.status === 'Viewing Booked' || lead.status === 'Negotiating') reasons.push('Active engagement (+25 intent)')
    if (lead.status === 'Reserved' || lead.status === 'Exchanged') reasons.push('Committed stage (+25 intent)')
    if (lead.timeline?.toLowerCase().includes('immediate') || lead.timeline?.toLowerCase().includes('asap')) reasons.push('Immediate timeline (+30 intent)')
    if (lead.status === 'Not Proceeding') reasons.push('Not proceeding (-50 intent)')

    return reasons
  }

  const scoreReasons = getScoreExplanation()

  // Composite NB Score (average of quality + intent)
  const nbScore = (qualityScore != null && intentScore != null)
    ? Math.round((qualityScore + intentScore) / 2)
    : qualityScore ?? intentScore ?? 0

  const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']
  const displayName = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown Lead'

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div>
        <Link href="/admin/leads" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {lead.email}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {lead.phone}
                </span>
              )}
              {(lead.job_title || lead.company_name) && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {[lead.job_title, lead.company_name].filter(Boolean).join(', ')}
                </span>
              )}
              {lead.country && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {lead.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. NB SCORE HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={`bg-[#111111] border ${classConfig.ringBg} rounded-xl`}>
        <div className="p-6">
          <div className="flex items-center gap-8">
            {/* Score Ring */}
            <div className="flex-shrink-0">
              <NBScoreRing score={nbScore} size={120} />
            </div>

            {/* Classification & Sub-scores */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${classConfig.bg} ${classConfig.text} text-sm px-3 py-1`}>
                  {classConfig.label}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/70 text-sm px-3 py-1">
                  {priority}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleRescore} disabled={isRescoring} className="border-white/20 text-white hover:bg-white/5">
                  <RefreshCw className={`w-4 h-4 mr-1 ${isRescoring ? 'animate-spin' : ''}`} />
                  {isRescoring ? 'Scoring...' : 'Re-score'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <SubScoreBar label="Quality" score={qualityScore} />
                <SubScoreBar label="Intent" score={intentScore} />
                <SubScoreBar label="Confidence" score={confidenceScore} />
              </div>

              {/* Score Reasons */}
              {scoreReasons.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {scoreReasons.map((reason, i) => (
                    <span key={i} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. KYC VERIFICATION BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* ═══════════════════════════════════════════════════════════════════
          4. AI SUMMARY
      ═══════════════════════════════════════════════════════════════════ */}
      {/* Buyer Overview - consolidated profile + AI summary */}
      {(lead.background_research || lead.buyer_summary || summary) && (
        <div className="bg-[#111111] border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-1">Buyer Overview</h4>
              <p className="text-sm text-white/60 leading-relaxed">
                {[lead.background_research || lead.buyer_summary, summary].filter(Boolean).join(' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. RECOMMENDED NEXT ACTION
      ═══════════════════════════════════════════════════════════════════ */}
      {nextAction && (
        <div className="bg-[#111111] border border-emerald-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-1">Recommended Next Action</h4>
                <p className="text-sm text-white/70 leading-relaxed mb-3">{nextAction}</p>
                <div className="flex gap-2 flex-wrap">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`}>
                      <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <Phone className="w-4 h-4 mr-1" /> Call
                      </Button>
                    </a>
                  )}
                  {lead.email && (
                    <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => setShowEmailComposer(true)}>
                      <Mail className="w-4 h-4 mr-1" /> Email
                    </Button>
                  )}
                  {lead.phone && (
                    <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          6. RISK FLAGS
      ═══════════════════════════════════════════════════════════════════ */}
      {riskFlags && riskFlags.length > 0 && (
        <div className="bg-[#111111] border border-orange-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-2">Risk Flags</h4>
                <ul className="space-y-1.5">
                  {riskFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-orange-300/80 flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-orange-400/60" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          BUYER PROFILE SUMMARY
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111111] border border-purple-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-3">Buyer Profile Summary</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {/* Left column */}
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-wider">Full Name</span>
                    <p className="text-sm text-white">{displayName}</p>
                  </div>
                  {lead.country && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Country</span>
                      <p className="text-sm text-white">{lead.country}</p>
                    </div>
                  )}
                  {(lead.budget_range || lead.budget) && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Budget</span>
                      <p className="text-sm text-white">{lead.budget_range || lead.budget}</p>
                    </div>
                  )}
                  {lead.payment_method && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Payment Method</span>
                      <p className="text-sm text-white">{lead.payment_method}</p>
                    </div>
                  )}
                  {lead.mortgage_status && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Mortgage Status</span>
                      <p className="text-sm text-white">{lead.mortgage_status}</p>
                    </div>
                  )}
                  {(lead.preferred_location || lead.location || lead.area) && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Preferred Location</span>
                      <p className="text-sm text-white">{lead.preferred_location || lead.location || lead.area}</p>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-3">
                  {(lead.preferred_bedrooms || lead.bedrooms) && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Bedrooms</span>
                      <p className="text-sm text-white">{lead.preferred_bedrooms || lead.bedrooms} Bed</p>
                    </div>
                  )}
                  {(lead.timeline_to_purchase || lead.timeline) && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Purchase Timeline</span>
                      <p className="text-sm text-white">{lead.timeline_to_purchase || lead.timeline}</p>
                    </div>
                  )}
                  {(lead.purchase_purpose || lead.purpose) && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Purpose</span>
                      <p className="text-sm text-white">{lead.purchase_purpose || lead.purpose}</p>
                    </div>
                  )}
                  {(lead.source_platform || lead.source) && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Source</span>
                      <p className="text-sm text-white">{lead.source_platform || lead.source}</p>
                    </div>
                  )}
                  {lead.development_name && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Development Interest</span>
                      <p className="text-sm text-white">{lead.development_name}</p>
                    </div>
                  )}
                  {lead.enquiry_type && (
                    <div>
                      <span className="text-xs text-white/40 uppercase tracking-wider">Enquiry Type</span>
                      <p className="text-sm text-white">{lead.enquiry_type}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Qualification indicators */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Qualification Indicators</span>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${lead.proof_of_funds ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {lead.proof_of_funds ? '✓' : '○'} Proof of Funds
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${hasPositiveConnection(lead.uk_broker) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {hasPositiveConnection(lead.uk_broker) ? '✓' : '○'} UK Broker
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${hasPositiveConnection(lead.uk_solicitor) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {hasPositiveConnection(lead.uk_solicitor) ? '✓' : '○'} UK Solicitor
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${(lead as any).ready_within_28_days || (lead as any).ready_in_28_days ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {(lead as any).ready_within_28_days || (lead as any).ready_in_28_days ? '✓' : '○'} Ready in 28 Days
                  </span>
                </div>
              </div>

              {/* LinkedIn / Company website if available */}
              {(lead.linkedin || lead.company_website) && (
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-3">
                  {lead.linkedin && (
                    <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                      <Briefcase className="w-3 h-3" />
                      LinkedIn Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {lead.company_website && (
                    <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                      <Globe className="w-3 h-3" />
                      Company Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          7. VERIFY THIS BUYER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111111] border border-amber-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Verify This Buyer</h4>
              <p className="text-sm text-white/60 mb-3">Complete KYC, AML and Proof of Funds checks via our integrated verification partner.</p>
              <div className="flex gap-2 flex-wrap">
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Run KYC / AML Check
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    <DollarSign className="w-4 h-4 mr-1" /> Proof of Funds
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
              </div>
              <p className="text-[10px] text-white/30 mt-2">Powered by Checkboard — KYC, AML & Source of Funds verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          8. THREE-COLUMN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 1 - Contact, Property, Financial
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Contact Information */}
          <SectionCard title="Contact Information" icon={User} accentColor="text-blue-400">
            <div className="space-y-0">
              <EditableTextField label="Full Name" value={lead.full_name} field="full_name" onSave={handleFieldSave} icon={User} />
              <EditableTextField label="First Name" value={lead.first_name} field="first_name" onSave={handleFieldSave} />
              <EditableTextField label="Last Name" value={lead.last_name} field="last_name" onSave={handleFieldSave} />
              <EditableTextField label="Email" value={lead.email} field="email" onSave={handleFieldSave} icon={Mail} type="email" />
              <EditableTextField label="Phone" value={lead.phone} field="phone" onSave={handleFieldSave} icon={Phone} type="tel" />
              <EditableTextField label="Country" value={lead.country} field="country" onSave={handleFieldSave} icon={Globe} />
            </div>
          </SectionCard>

          {/* Property Requirements */}
          <SectionCard title="Property Requirements" icon={Home} accentColor="text-emerald-400">
            <div className="space-y-0">
              {(() => {
                const parsedBudget = parseBudgetRange(lead.budget_range || lead.budget)
                const minBudget = lead.budget_min || parsedBudget.min
                const maxBudget = lead.budget_max || parsedBudget.max

                return (
                  <>
                    <EditableTextField label="Budget" value={lead.budget_range || lead.budget} field="budget_range" onSave={handleFieldSave} icon={DollarSign} />
                    <DataRow label="Min Budget" value={formatBudgetValue(minBudget)} />
                    <DataRow label="Max Budget" value={formatBudgetValue(maxBudget)} />
                  </>
                )
              })()}
              <EditableSelectField
                label="Bedrooms"
                value={String(lead.preferred_bedrooms || lead.bedrooms || '')}
                field="preferred_bedrooms"
                onSave={handleFieldSave}
                icon={Home}
                options={[
                  { value: 'Studio', label: 'Studio' },
                  { value: '1', label: '1 Bedroom' },
                  { value: '2', label: '2 Bedrooms' },
                  { value: '3', label: '3 Bedrooms' },
                  { value: '4', label: '4 Bedrooms' },
                  { value: '5+', label: '5+ Bedrooms' },
                ]}
              />
              <EditableTextField label="Location" value={lead.preferred_location || lead.location || lead.area} field="preferred_location" onSave={handleFieldSave} icon={MapPin} />
              <EditableSelectField
                label="Timeline"
                value={lead.timeline_to_purchase || lead.timeline}
                field="timeline_to_purchase"
                onSave={handleFieldSave}
                icon={Calendar}
                options={[
                  { value: 'Immediately', label: 'Immediately' },
                  { value: 'Within 1 month', label: 'Within 1 month' },
                  { value: 'Within 3 months', label: 'Within 3 months' },
                  { value: 'Within 6 months', label: 'Within 6 months' },
                  { value: 'Within 12 months', label: 'Within 12 months' },
                  { value: '12+ months', label: '12+ months' },
                  { value: 'Just browsing', label: 'Just browsing' },
                ]}
              />
              <EditableSelectField
                label="Purpose"
                value={lead.purchase_purpose || lead.purpose}
                field="purchase_purpose"
                onSave={handleFieldSave}
                options={[
                  { value: 'Investment', label: 'Investment' },
                  { value: 'Residence', label: 'Residence' },
                  { value: 'Both', label: 'Both' },
                ]}
              />
              <EditableBooleanField label="Ready in 28 Days" value={lead.ready_within_28_days || lead.ready_in_28_days} field="ready_within_28_days" onSave={handleFieldSave} />
            </div>
          </SectionCard>

          {/* Financial Qualification */}
          <SectionCard title="Financial Qualification" icon={DollarSign} accentColor="text-amber-400">
            <div className="space-y-0">
              <EditableSelectField
                label="Payment Method"
                value={lead.payment_method}
                field="payment_method"
                onSave={handleFieldSave}
                icon={DollarSign}
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Mortgage', label: 'Mortgage' },
                  { value: 'Cash & Mortgage', label: 'Cash & Mortgage' },
                ]}
              />
              <EditableSelectField
                label="Mortgage Status"
                value={lead.mortgage_status}
                field="mortgage_status"
                onSave={handleFieldSave}
                options={[
                  { value: 'Pre-approved', label: 'Pre-approved' },
                  { value: 'In process', label: 'In process' },
                  { value: 'Not started', label: 'Not started' },
                  { value: 'N/A - Cash buyer', label: 'N/A - Cash buyer' },
                ]}
              />
              <EditableBooleanField label="Proof of Funds" value={lead.proof_of_funds} field="proof_of_funds" onSave={handleFieldSave} />
              <EditableConnectionStatus
                label="UK Broker"
                value={lead.uk_broker}
                onChange={(newValue) => updateLead(lead.id, { uk_broker: newValue })}
              />
              <EditableConnectionStatus
                label="UK Solicitor"
                value={lead.uk_solicitor}
                onChange={(newValue) => updateLead(lead.id, { uk_solicitor: newValue })}
              />
            </div>
          </SectionCard>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 2 - Source, Engagement, Conversations, Calls
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Source & Campaign */}
          <SectionCard title="Source & Campaign" icon={Briefcase} accentColor="text-purple-400">
            <div className="space-y-0">
              <EditableTextField label="Source" value={lead.source_platform || lead.source} field="source_platform" onSave={handleFieldSave} />
              <EditableTextField label="Campaign/Development" value={lead.source_campaign || lead.campaign || lead.development_name} field="source_campaign" onSave={handleFieldSave} />
              <EditableTextField label="Development Name" value={lead.development_name} field="development_name" onSave={handleFieldSave} icon={Building} />
              <EditableTextField label="Enquiry Type" value={lead.enquiry_type} field="enquiry_type" onSave={handleFieldSave} />
              <DataRow label="Campaign ID" value={lead.campaign_id ? lead.campaign_id.substring(0, 8) + '...' : '-'} icon={Hash} />
              <DataRow label="Company ID" value={lead.company_id ? lead.company_id.substring(0, 8) + '...' : '-'} icon={Building} />
            </div>
          </SectionCard>

          {/* Engagement & Communication */}
          <SectionCard title="Engagement & Communication" icon={MessageCircle} accentColor="text-cyan-400">
            <div className="space-y-0">
              <EditableBooleanField label="Viewing Intent" value={(lead as any).viewing_intent_confirmed} field="viewing_intent_confirmed" onSave={handleFieldSave} />
              <EditableBooleanField label="Viewing Booked" value={(lead as any).viewing_booked} field="viewing_booked" onSave={handleFieldSave} />
              <EditableTextField label="Viewing Date" value={(lead as any).viewing_date} field="viewing_date" onSave={handleFieldSave} icon={Calendar} />
              <EditableBooleanField label="Has Replied" value={(lead as any).replied} field="replied" onSave={handleFieldSave} />
              <EditableBooleanField label="Stop Comms" value={(lead as any).stop_agent_communication || (lead as any).stop_comms} field="stop_agent_communication" onSave={handleFieldSave} />
              <EditableTextField label="Next Follow-up" value={(lead as any).next_follow_up} field="next_follow_up" onSave={handleFieldSave} icon={Clock} />
              <EditableBooleanField label="Broker Connected" value={(lead as any).connect_to_broker || (lead as any).broker_connected} field="connect_to_broker" onSave={handleFieldSave} />
            </div>
          </SectionCard>

          {/* WhatsApp Conversation Thread */}
          <ConversationThread
            buyerId={lead.id}
            buyerName={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'}
            buyerPhone={lead.phone}
            channel="whatsapp"
            maxHeight="400px"
            agentTranscript={lead.agent_transcript}
          />

          {/* Call Summary & Transcript */}
          {((lead as any).transcript || (lead as any).call_summary) && (
            <SectionCard title="Call History" icon={MessageSquare} accentColor="text-violet-400">
              <div className="space-y-3">
                {(lead as any).call_summary && (
                  <div>
                    <div className="text-sm text-white/50 mb-1">Call Summary</div>
                    <div className="bg-white/5 rounded-lg p-3 text-sm whitespace-pre-wrap">{(lead as any).call_summary}</div>
                  </div>
                )}
                {(lead as any).transcript && (
                  <div>
                    <div className="text-sm text-white/50 mb-1">Transcript</div>
                    <div className="bg-white/5 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{(lead as any).transcript}</div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 3 - Status, Assignment, Notes (LeadSidebar)
        ───────────────────────────────────────────────────────────────── */}
        <LeadSidebar
          lead={lead}
          users={users}
          classification={classification}
          priority={priority}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onUpdateLead={updateLead}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          EMAIL COMPOSER MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {lead.email && (
        <EmailComposer
          open={showEmailComposer}
          onOpenChange={setShowEmailComposer}
          recipientEmail={lead.email}
          recipientName={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'}
          leadId={lead.id}
          developmentName={lead.campaign}
        />
      )}
    </div>
  )
}
