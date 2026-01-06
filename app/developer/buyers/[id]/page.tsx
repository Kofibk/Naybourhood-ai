'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import { EmailComposer } from '@/components/EmailComposer'
import { toast } from 'sonner'
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

const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  'Hot': { bg: 'bg-red-500', text: 'text-white', label: 'Hot' },
  'Warm-Qualified': { bg: 'bg-orange-500', text: 'text-white', label: 'Warm (Qualified)' },
  'Warm-Engaged': { bg: 'bg-amber-500', text: 'text-white', label: 'Warm (Engaged)' },
  'Nurture': { bg: 'bg-blue-400', text: 'text-white', label: 'Nurture' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold' },
  'Disqualified': { bg: 'bg-gray-600', text: 'text-white', label: 'Disqualified' },
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

function ScoreCard({ label, score, maxScore = 100 }: { label: string; score: number | null | undefined; maxScore?: number }) {
  if (score === null || score === undefined) {
    return (
      <div className="border rounded-lg p-4 min-w-[120px] bg-card">
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-bold text-muted-foreground">-</div>
        <div className="w-full h-2 bg-muted rounded-full mt-2" />
      </div>
    )
  }

  const percentage = (score / maxScore) * 100
  const getColor = (p: number) => {
    if (p >= 70) return 'bg-green-500'
    if (p >= 45) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  return (
    <div className="border rounded-lg p-4 min-w-[120px] bg-card">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold">{score}</div>
      <div className="w-full h-2 bg-muted rounded-full mt-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
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
  const { leads, isLoading, updateLead, refreshData } = useData()

  const [isRescoring, setIsRescoring] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [showEmailComposer, setShowEmailComposer] = useState(false)

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
        await refreshData()
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
  const classification = lead.ai_classification ?? 'Cold'
  const config = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/developer/buyers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
          <h1 className="text-2xl font-bold">{lead.full_name || 'Unknown'}</h1>
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

      {/* Score Cards */}
      <div className="flex gap-4 flex-wrap">
        <ScoreCard label="Quality" score={qualityScore} />
        <ScoreCard label="Intent" score={intentScore} />
        <div className="border rounded-lg p-4 min-w-[120px] bg-card">
          <div className="text-sm text-muted-foreground mb-1">Classification</div>
          <Badge className={`${config.bg} ${config.text} text-sm px-3 py-1`}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Quick Actions - CRITICAL FOR CONVERSION */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Take Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
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
        </CardContent>
      </Card>

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

          {/* Risk Flags */}
          {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 && (
            <Card className="border-yellow-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" /> Risk Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {lead.ai_risk_flags.map((flag: string, i: number) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> {flag}
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
              <DataRow label="UK Broker" value={<BooleanIndicator value={lead.uk_broker} />} />
              <DataRow label="UK Solicitor" value={<BooleanIndicator value={lead.uk_solicitor} />} />
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
