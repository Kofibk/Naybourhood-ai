'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { Lead } from '@/types'
import { fetchLeadById, updateLeadStatus } from '@/lib/queries/leads'
import { KycVerificationBanner } from '@/components/kyc/KycVerificationBanner'
import { toast } from 'sonner'
import {
  ArrowLeft, Phone, Mail, MessageCircle, User, Building, DollarSign, MapPin,
  Calendar, Clock, Target, Sparkles, Shield, ShieldCheck, ExternalLink,
  TrendingUp, CheckCircle, FileText, RefreshCw, CircleDot, Home,
  ShieldAlert, AlertTriangle, Save, Edit as EditIcon,
} from 'lucide-react'

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

const STATUS_OPTIONS = [
  'Contact Pending', 'Follow Up', 'Viewing Booked', 'Negotiating',
  'Reserved', 'Exchanged', 'Completed', 'Not Proceeding',
]

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

function BooleanIndicator({ value }: { value: boolean | undefined | null }) {
  return value ? (
    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Yes</span>
  ) : (
    <span className="text-red-400 flex items-center gap-1"><span className="h-4 w-4 inline-flex items-center justify-center">—</span> No</span>
  )
}

export default function AgentLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRescoring, setIsRescoring] = useState(false)

  useEffect(() => {
    const loadLead = async () => {
      setLoading(true)
      const data = await fetchLeadById(params.id as string)
      setLead(data)
      setLoading(false)
    }
    loadLead()
  }, [params.id])

  const handleStatusChange = async (status: string) => {
    if (!lead) return
    await updateLeadStatus(lead.id, status)
    const data = await fetchLeadById(params.id as string)
    setLead(data)
    toast.success(`Status updated to ${status}`)
  }

  const handleRescore = async () => {
    if (!lead) return
    setIsRescoring(true)
    try {
      const response = await fetch('/api/ai/score-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: lead.id }),
      })
      if (response.ok) {
        const data = await fetchLeadById(params.id as string)
        setLead(data)
        toast.success('Lead rescored successfully')
      }
    } catch (error) {
      console.error('Error rescoring lead:', error)
      toast.error('Failed to rescore')
    } finally {
      setIsRescoring(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-5 animate-pulse">
              <div className="h-4 w-24 bg-white/10 rounded mb-2" />
              <div className="h-8 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/agent/my-leads" className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to My Leads
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl py-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Lead not found</h3>
          <Button onClick={() => router.push('/agent/my-leads')}>Back to My Leads</Button>
        </div>
      </div>
    )
  }

  const qualityScore = lead.qualityScore ?? 0
  const intentScore = lead.intentScore ?? 0
  const nbScore = qualityScore
  const confidence = lead.aiConfidence ?? 0
  const confidencePercent = confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
  const classification = lead.classification ?? 'Cold'
  const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']

  const getNextAction = () => {
    switch (lead.status) {
      case 'Contact Pending': return 'Make initial contact via phone or WhatsApp. Verify identity and confirm interest.'
      case 'Follow Up': return 'Follow up on previous conversation. Share development brochure and schedule a viewing.'
      case 'Viewing Booked': return 'Confirm viewing appointment. Prepare property details and pricing information.'
      case 'Negotiating': return 'Follow up on offer status. Discuss pricing flexibility and completion timeline.'
      default: return lead.aiNextAction || 'Contact this lead to confirm interest and timeline.'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/agent/my-leads" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to My Leads
          </Link>
          <h1 className="text-2xl font-bold text-white">{lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown'}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/50 mt-1">
            {lead.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>}
            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {lead.phone}</span>}
            {(lead.job_title || lead.company_name) && <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {[lead.job_title, lead.company_name].filter(Boolean).join(', ')}</span>}
            {lead.country && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {lead.country}</span>}
          </div>
        </div>
      </div>

      {/* NB Score Hero */}
      <div className={`border ${classConfig.ringBg} bg-[#111111] rounded-xl`}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex flex-col items-center flex-shrink-0">
              <NBScoreRing score={nbScore} size={120} strokeWidth={10} label="NB Score" />
            </div>
            <div className="flex-1 space-y-5 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${classConfig.bg} ${classConfig.text} text-base px-4 py-1.5`}>{classConfig.label}</Badge>
                {lead.classification && (
                  <Badge variant="outline" className="text-xs border-white/20 text-white/70">{lead.classification}</Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleRescore} disabled={isRescoring} className="border-white/20 text-white hover:bg-white/5">
                  <RefreshCw className={`w-4 h-4 mr-1 ${isRescoring ? 'animate-spin' : ''}`} />
                  {isRescoring ? 'Scoring...' : 'Re-score'}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SubScoreBar label="Quality" score={qualityScore} />
                <SubScoreBar label="Intent" score={intentScore} />
                <SubScoreBar label="Confidence" score={confidencePercent} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Verification Banner */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* AI Summary */}
      {lead.aiSummary && (
        <div className="bg-[#111111] border border-blue-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-1">AI Summary</h4>
                <p className="text-sm text-white/70 leading-relaxed">{lead.aiSummary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Next Action */}
      <div className="bg-[#111111] border border-emerald-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Recommended Next Action</h4>
              <p className="text-sm text-white/60 mb-3">{getNextAction()}</p>
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" asChild>
                    <a href={`tel:${lead.phone}`}><Phone className="w-4 h-4 mr-1" /> Call</a>
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5" asChild>
                    <a href={`mailto:${lead.email}`}><Mail className="w-4 h-4 mr-1" /> Send Email</a>
                  </Button>
                )}
                {lead.phone && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5" asChild>
                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {lead.aiRiskFlags && lead.aiRiskFlags.length > 0 && (
        <div className="bg-[#111111] border border-orange-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-300 mb-2">Risk Flags</h4>
                <div className="flex flex-wrap gap-2">
                  {lead.aiRiskFlags.map((flag: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-orange-500/10 text-orange-300 border-orange-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify This Buyer */}
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Status */}
          <SectionCard title="Status" icon={CircleDot}>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  variant={lead.status === status ? 'default' : 'outline'}
                  size="sm"
                  className={`justify-start text-xs ${lead.status !== status ? 'border-white/10 text-white/60 hover:bg-white/5' : ''}`}
                  onClick={() => handleStatusChange(status)}
                >
                  {lead.status === status && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status}
                </Button>
              ))}
            </div>
          </SectionCard>

          {/* AI Recommendations */}
          {lead.aiRecommendations && lead.aiRecommendations.length > 0 && (
            <SectionCard title="AI Recommendations" icon={Sparkles} accentColor="text-blue-400">
              <ul className="space-y-2">
                {lead.aiRecommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="text-emerald-400 mt-0.5">•</span> {rec}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Notes */}
          <SectionCard title="Notes" icon={FileText}>
            <div className="bg-white/5 rounded-lg p-3 min-h-[80px]">
              <p className="text-sm text-white/40 italic">{lead.callSummary || 'No notes yet...'}</p>
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Contact */}
          <SectionCard title="Contact Information" icon={User}>
            <div className="space-y-0">
              <DataRow label="Name" value={lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim()} icon={User} />
              <DataRow label="Email" value={lead.email} icon={Mail} />
              <DataRow label="Phone" value={lead.phone} icon={Phone} />
              <DataRow label="Country" value={lead.country} icon={MapPin} />
            </div>
          </SectionCard>

          {/* Property Requirements */}
          <SectionCard title="Property Requirements" icon={Home}>
            <div className="space-y-0">
              <DataRow label="Budget" value={lead.budgetRange} icon={DollarSign} />
              <DataRow label="Bedrooms" value={lead.bedrooms} icon={Home} />
              <DataRow label="Location" value={lead.location} icon={MapPin} />
              <DataRow label="Timeline" value={lead.timeline} icon={Calendar} />
              <DataRow label="Purpose" value={lead.purpose} />
            </div>
          </SectionCard>

          {/* Financial */}
          <SectionCard title="Financial" icon={DollarSign}>
            <div className="space-y-0">
              <DataRow label="Payment Method" value={lead.paymentMethod} icon={DollarSign} />
              <DataRow label="Proof of Funds" value={<BooleanIndicator value={lead.proofOfFunds} />} />
            </div>
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Timeline" icon={Clock}>
            <div className="space-y-0">
              <DataRow label="Date Added" value={formatDate(lead.createdAt)} icon={Calendar} />
              <DataRow label="Last Updated" value={formatDate(lead.updatedAt)} />
              <DataRow label="Source" value={lead.source} />
              <DataRow label="Campaign" value={lead.campaign || lead.developmentName} icon={Building} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
