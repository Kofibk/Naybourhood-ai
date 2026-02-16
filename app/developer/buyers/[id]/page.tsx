'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useLeads } from '@/hooks/useLeads'
import { EmailComposer } from '@/components/EmailComposer'
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
  'Warm-Qualified': { bg: 'bg-emerald-600', text: 'text-white', label: 'Qualified', ringBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Qualified': { bg: 'bg-emerald-600', text: 'text-white', label: 'Qualified', ringBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Warm-Engaged': { bg: 'bg-amber-500', text: 'text-white', label: 'Warm', ringBg: 'bg-amber-500/10 border-amber-500/30' },
  'Needs Qualification': { bg: 'bg-amber-500', text: 'text-white', label: 'Needs Qualification', ringBg: 'bg-amber-500/10 border-amber-500/30' },
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

// Connection Status Display for Broker/Solicitor
const CONNECTION_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle | null; color: string; label: string }> = {
  'yes': { icon: CheckCircle, color: 'text-green-600', label: 'Yes, already has' },
  'introduced': { icon: CheckCircle, color: 'text-green-600', label: 'Introduction made' },
  'no': { icon: XCircle, color: 'text-red-400', label: "No, doesn't have" },
  'unknown': { icon: null, color: 'text-muted-foreground', label: 'Unknown' },
}

function ConnectionStatusDisplay({ value }: { value: string | boolean | undefined | null }) {
  // Handle legacy boolean values
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

function SubScoreBar({ label, score, maxScore = 100 }: { label: string; score: number | null | undefined; maxScore?: number }) {
  const value = score ?? 0
  const percentage = Math.min((value / maxScore) * 100, 100)
  const color = getNBScoreColor(value)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{score ?? '-'}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value || '-'}</span>
    </div>
  )
}

export default function DeveloperLeadDetailPage() {
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/developer/buyers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Lead not found</h3>
            <Button onClick={() => router.push('/developer/buyers')}>Back to Leads</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const qualityScore = lead.ai_quality_score ?? lead.quality_score
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
          <Link href="/developer/buyers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {lead.full_name || 'Unknown'}
            {kycCheck && <KycStatusBadge status={kycCheck.status} />}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {lead.phone}
              </span>
            )}
          </div>
        </div>
        <Button variant="default" onClick={handleRescore} disabled={isRescoring}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRescoring ? 'animate-spin' : ''}`} />
          {isRescoring ? 'Scoring...' : 'Re-score'}
        </Button>
      </div>

      {/* KYC Verification Banner */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* NB Score Hero Section */}
      <Card className={`border ${classConfig.ringBg}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Large NB Score Ring */}
            <div className="flex flex-col items-center flex-shrink-0">
              <NBScoreRing score={nbScore} size={120} strokeWidth={10} label="NB Score" />
            </div>

            {/* Classification Badge + Sub-scores */}
            <div className="flex-1 space-y-5 w-full">
              {/* Classification */}
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

              {/* Three sub-score bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SubScoreBar label="Quality" score={qualityScore} />
                <SubScoreBar label="Intent" score={intentScore} />
                <SubScoreBar label="Confidence" score={confidencePercent} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {lead.ai_summary && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">AI Summary</h4>
                <p className="text-sm text-blue-800/80 leading-relaxed">{lead.ai_summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Next Action */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">Recommended Next Action</h4>
              <p className="text-sm text-muted-foreground mb-3">
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
        </CardContent>
      </Card>

      {/* Risk Flags — shown as warning badges if non-empty */}
      {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 && (
        <Card className="border-orange-300 bg-orange-50/50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-900 mb-2">Risk Flags</h4>
                <div className="flex flex-wrap gap-2">
                  {lead.ai_risk_flags.map((flag: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* End NB Score Hero Section */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Status Update */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          {lead.ai_recommendations && lead.ai_recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lead.ai_recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span> {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Notes</span>
                {!editingNotes && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes..."
                    rows={4}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-3 min-h-[80px]">
                  {lead.notes ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans">{lead.notes}</pre>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Lead Details */}
        <div className="space-y-4">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Name" value={lead.full_name} icon={User} />
              <DataRow label="Email" value={lead.email} icon={Mail} />
              <DataRow label="Phone" value={lead.phone} icon={Phone} />
              <DataRow label="Country" value={lead.country} />
            </CardContent>
          </Card>

          {/* Property Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-4 h-4" /> Property Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Budget" value={lead.budget || lead.budget_range} icon={DollarSign} />
              <DataRow label="Bedrooms" value={lead.preferred_bedrooms || lead.bedrooms} />
              <DataRow label="Location" value={lead.location || lead.area} icon={MapPin} />
              <DataRow label="Timeline" value={lead.timeline} icon={Calendar} />
            </CardContent>
          </Card>

          {/* Financial */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Financial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Payment Method" value={lead.payment_method} />
              <DataRow label="Proof of Funds" value={<BooleanIndicator value={lead.proof_of_funds} />} />
              <DataRow label="UK Broker" value={<ConnectionStatusDisplay value={lead.uk_broker} />} />
              <DataRow label="UK Solicitor" value={<ConnectionStatusDisplay value={lead.uk_solicitor} />} />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Date Added" value={formatDate(lead.date_added || lead.created_at)} />
              <DataRow label="Last Updated" value={formatDate(lead.updated_at)} />
              <DataRow label="Source" value={lead.source} />
              <DataRow label="Campaign" value={lead.campaign} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming Soon — Phase 5 & 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="opacity-60">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-0.5">NB Score History</h4>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
                <p className="text-xs text-muted-foreground">Track how this buyer&apos;s score changes after each interaction.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-0.5">Engagement Timeline</h4>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
                <p className="text-xs text-muted-foreground">Full activity log of calls, emails, viewings, and score changes.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Composer Modal */}
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
