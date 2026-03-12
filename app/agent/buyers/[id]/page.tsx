'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useLeads } from '@/hooks/useLeads'
import { EmailComposer } from '@/components/EmailComposer'
import { ConversationThread } from '@/components/ConversationThread'
import { BuyerOverviewCard } from '@/components/ai/BuyerOverviewCard'
import { toast } from 'sonner'
import { KycVerificationBanner, KycStatusBadge } from '@/components/kyc/KycVerificationBanner'
import { useKycCheck } from '@/hooks/useKycCheck'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  RefreshCw,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  User,
  Building,
  DollarSign,
  MapPin,
  Clock,
  Save,
  Edit,
  CheckCircle,
  XCircle,
  Zap,
  ShieldAlert,
  TrendingUp,
  Sparkles,
  Shield,
} from 'lucide-react'

const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
]

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

function BooleanIndicator({ value }: { value: boolean | undefined | null }) {
  return value ? (
    <span className="text-green-600 flex items-center gap-1">
      <CheckCircle className="h-4 w-4" /> Yes
    </span>
  ) : (
    <span className="text-red-400 flex items-center gap-1">
      <XCircle className="h-4 w-4" /> No
    </span>
  )
}

const CONNECTION_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle | null; color: string; label: string }> = {
  'yes': { icon: CheckCircle, color: 'text-green-600', label: 'Yes, already has' },
  'introduced': { icon: CheckCircle, color: 'text-green-600', label: 'Introduction made' },
  'no': { icon: XCircle, color: 'text-red-400', label: "No, doesn't have" },
  'unknown': { icon: null, color: 'text-muted-foreground', label: 'Unknown' },
}

function ConnectionStatusDisplay({ value }: { value: string | boolean | undefined | null }) {
  let statusKey = 'unknown'
  if (typeof value === 'boolean') {
    statusKey = value ? 'yes' : 'unknown'
  } else if (typeof value === 'string') {
    statusKey = value
  }

  const config = CONNECTION_STATUS_CONFIG[statusKey] || CONNECTION_STATUS_CONFIG['unknown']
  const Icon = config.icon

  return (
    <span className={`flex items-center gap-1 ${config.color}`}>
      {Icon ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4 inline-flex items-center justify-center">—</span>}
      <span className="text-xs">{config.label}</span>
    </span>
  )
}

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

function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-white text-right max-w-[60%] truncate">{value || '-'}</span>
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
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function AgentBuyerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { leads, isLoading, updateLead, refreshLeads } = useLeads()

  const [isRescoring, setIsRescoring] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  const { kycCheck } = useKycCheck(params.id as string)

  const lead = useMemo(() => {
    return leads.find((l) => l.id === params.id)
  }, [leads, params.id])

  useEffect(() => {
    if (lead?.notes) {
      setNotesValue(lead.notes)
    }
  }, [lead?.notes])

  const handleStatusChange = async (status: string) => {
    if (!lead) return
    await updateLead(lead.id, { status })
    toast.success(`Status updated to ${status}`)
  }

  const handleSaveNotes = async () => {
    if (!lead) return
    await updateLead(lead.id, { notes: notesValue })
    setEditingNotes(false)
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
        await refreshLeads()
        toast.success('Lead rescored successfully')
      } else {
        toast.error('Failed to rescore lead')
      }
    } catch (error) {
      console.error('Failed to score lead:', error)
      toast.error('Failed to rescore lead')
    } finally {
      setIsRescoring(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-8 w-16 bg-white/10 rounded" />
                <div className="h-3 w-32 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/agent/buyers" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Buyers
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl py-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Lead not found</h3>
          <Button onClick={() => router.push('/agent/buyers')}>Back to Buyers</Button>
        </div>
      </div>
    )
  }

  const qualityScore = lead.final_score ?? lead.ai_quality_score ?? lead.quality_score
  const intentScore = lead.ai_intent_score ?? lead.intent_score
  const nbScore = lead.final_score ?? qualityScore ?? 0
  const confidence = lead.ai_confidence ?? 0
  const confidencePercent = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
  const classification = lead.ai_classification ?? 'Cold'
  const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/agent/buyers" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Buyers
          </Link>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{lead.full_name || 'Unknown'}</h1>
            {kycCheck && <KycStatusBadge status={kycCheck.status} />}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50 flex-wrap">
            {lead.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {lead.phone}
              </span>
            )}
            {(lead.job_title || lead.company_name) && (
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                {[lead.job_title, lead.company_name].filter(Boolean).join(', ')}
              </span>
            )}
            {lead.country && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {lead.country}
              </span>
            )}
          </div>
        </div>
        <Button variant="default" onClick={handleRescore} disabled={isRescoring} className="flex-shrink-0">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRescoring ? 'animate-spin' : ''}`} />
          {isRescoring ? 'Scoring...' : 'Re-score'}
        </Button>
      </div>

      {/* KYC Verification Banner */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* NB Score Hero */}
      <div className="bg-[#111111] rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex flex-col items-center flex-shrink-0">
            <NBScoreRing score={nbScore} size={120} strokeWidth={10} label="NB Score" />
          </div>
          <div className="flex-1 space-y-5 w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${classConfig.bg} ${classConfig.text} text-base px-4 py-1.5`}>
                {classConfig.label}
              </Badge>
              {lead.ai_priority && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Priority: {lead.ai_priority}
                </Badge>
              )}
              {lead.conversion_probability_pct != null && (
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" /> {lead.conversion_probability_pct}% conversion
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SubScoreBar label="Quality" score={qualityScore} />
              <SubScoreBar label="Intent" score={intentScore} />
              <SubScoreBar label="Confidence" score={confidencePercent} />
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Overview - consolidated profile + AI summary */}
      <BuyerOverviewCard
        backgroundResearch={lead.background_research}
        buyerSummary={lead.buyer_summary}
        aiSummary={lead.ai_summary}
      />

      {/* Recommended Next Action */}
      <div className="bg-[#111111] border border-emerald-500/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-emerald-300 mb-1">Recommended Next Action</h4>
            <p className="text-sm text-white/50 mb-3">
              {lead.ai_next_action || 'Contact this lead to confirm interest and timeline'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {lead.phone && (
                <Button size="sm" asChild>
                  <a href={`tel:${lead.phone}`}>
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </a>
                </Button>
              )}
              {lead.email && (
                <Button size="sm" variant="outline" onClick={() => setShowEmailComposer(true)}>
                  <Mail className="w-4 h-4 mr-1" /> Send Email
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
      </div>

      {/* Verify This Buyer */}
      <div className="bg-[#111111] border border-amber-500/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-300 mb-1">Verify This Buyer</h4>
            <p className="text-sm text-white/50 mb-3">
              Run a background check on this buyer to verify their identity, financial standing, and credibility.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10" asChild>
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Shield className="w-4 h-4 mr-1" /> Run Checkboard Verification
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 && (
        <div className="bg-[#111111] border border-orange-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-orange-300 mb-2">Risk Flags</h4>
              <div className="flex flex-wrap gap-2">
                {lead.ai_risk_flags.map((flag: string, i: number) => (
                  <Badge key={i} variant="outline" className="bg-orange-500/10 text-orange-300 border-orange-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {flag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Profile Summary */}
      <div className="bg-[#111111] border border-purple-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-3">Buyer Profile Summary</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-white/40 uppercase tracking-wider">Full Name</span>
                    <p className="text-sm text-white">{lead.full_name || 'Unknown'}</p>
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

              <div className="mt-4 pt-3 border-t border-white/10">
                <span className="text-xs text-white/40 uppercase tracking-wider block mb-2">Qualification Indicators</span>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${lead.proof_of_funds ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {lead.proof_of_funds ? '✓' : '○'} Proof of Funds
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${lead.uk_broker === 'yes' || lead.uk_broker === 'introduced' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {lead.uk_broker === 'yes' || lead.uk_broker === 'introduced' ? '✓' : '○'} UK Broker
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${lead.uk_solicitor === 'yes' || lead.uk_solicitor === 'introduced' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {lead.uk_solicitor === 'yes' || lead.uk_solicitor === 'introduced' ? '✓' : '○'} UK Solicitor
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${lead.ready_within_28_days || lead.ready_in_28_days ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                    {lead.ready_within_28_days || lead.ready_in_28_days ? '✓' : '○'} Ready in 28 Days
                  </span>
                </div>
              </div>

              {(lead.linkedin || lead.company_website) && (
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-3">
                  {lead.linkedin && (
                    <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                      <User className="w-3 h-3" />
                      LinkedIn Profile
                    </a>
                  )}
                  {lead.company_website && (
                    <a href={lead.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                      <Building className="w-3 h-3" />
                      Company Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Conversation Thread */}
      <ConversationThread
        buyerId={lead.id}
        buyerName={lead.full_name || 'Lead'}
        buyerPhone={lead.phone}
        channel="whatsapp"
        maxHeight="400px"
        agentTranscript={lead.agent_transcript}
      />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <SectionCard title="Update Status" icon={CheckCircle} accentColor="text-emerald-400">
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  variant={lead.status === status ? 'default' : 'outline'}
                  size="sm"
                  className="justify-start"
                  onClick={() => handleStatusChange(status)}
                >
                  {lead.status === status && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status}
                </Button>
              ))}
            </div>
          </SectionCard>

          {lead.ai_recommendations && lead.ai_recommendations.length > 0 && (
            <SectionCard title="AI Recommendations" icon={Lightbulb} accentColor="text-amber-400">
              <ul className="space-y-2">
                {lead.ai_recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-amber-400 mt-0.5">•</span> {rec}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Notes" icon={Edit} accentColor="text-white/50">
            <div>
              <div className="flex justify-end mb-2">
                {!editingNotes && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)} className="text-white/40 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes..."
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-3 min-h-[80px]">
                  {lead.notes ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans text-white/70">{lead.notes}</pre>
                  ) : (
                    <p className="text-sm text-white/30 italic">No notes yet</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <SectionCard title="Contact Information" icon={User} accentColor="text-blue-400">
            <div>
              <DataRow label="Name" value={lead.full_name} icon={User} />
              <DataRow label="Email" value={lead.email} icon={Mail} />
              <DataRow label="Phone" value={lead.phone} icon={Phone} />
              <DataRow label="Country" value={lead.country} />
            </div>
          </SectionCard>

          <SectionCard title="Property Requirements" icon={Building} accentColor="text-purple-400">
            <div>
              <DataRow label="Budget" value={lead.budget || lead.budget_range} icon={DollarSign} />
              <DataRow label="Bedrooms" value={lead.preferred_bedrooms || lead.bedrooms} />
              <DataRow label="Location" value={lead.location || lead.area} icon={MapPin} />
              <DataRow label="Timeline" value={lead.timeline} icon={Calendar} />
            </div>
          </SectionCard>

          <SectionCard title="Financial" icon={DollarSign} accentColor="text-emerald-400">
            <div>
              <DataRow label="Payment Method" value={lead.payment_method} />
              <DataRow label="Proof of Funds" value={<BooleanIndicator value={lead.proof_of_funds} />} />
              <DataRow label="UK Broker" value={<ConnectionStatusDisplay value={lead.uk_broker} />} />
              <DataRow label="UK Solicitor" value={<ConnectionStatusDisplay value={lead.uk_solicitor} />} />
            </div>
          </SectionCard>

          <SectionCard title="Timeline" icon={Clock} accentColor="text-cyan-400">
            <div>
              <DataRow label="Date Added" value={formatDate(lead.date_added || lead.created_at)} />
              <DataRow label="Last Updated" value={formatDate(lead.updated_at)} />
              <DataRow label="Source" value={lead.source} />
              <DataRow label="Campaign" value={lead.campaign} />
            </div>
          </SectionCard>
        </div>
      </div>

      {lead.email && (
        <EmailComposer
          open={showEmailComposer}
          onOpenChange={setShowEmailComposer}
          recipientEmail={lead.email}
          recipientName={lead.full_name || 'Lead'}
          leadId={lead.id}
          developmentName={lead.campaign}
        />
      )}
    </div>
  )
}
