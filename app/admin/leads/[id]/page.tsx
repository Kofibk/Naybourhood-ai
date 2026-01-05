'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import type { Buyer } from '@/types'
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
  Flame,
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
function ScoreCard({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 70) return 'bg-red-500'
    if (s >= 45) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  return (
    <div className="border rounded-lg p-3 min-w-[120px] bg-card">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{score}</div>
      <div className="w-full h-2 bg-muted rounded-full mt-1">
        <div
          className={`h-2 rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Classification Badge
function ClassificationBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const getClassification = (s: number) => {
    if (s >= 70) return { label: 'Hot', icon: '🔥', bg: 'bg-red-500' }
    if (s >= 45) return { label: 'Warm', icon: '🟠', bg: 'bg-orange-500' }
    return { label: 'Low', icon: '⚪', bg: 'bg-gray-400' }
  }

  const { label, icon, bg } = getClassification(score)
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-lg' : 'px-3 py-1.5 text-sm'

  return (
    <span className={`rounded-lg font-medium text-white ${bg} ${sizeClasses}`}>
      {icon} {label}
    </span>
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

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { leads, users, isLoading, updateLead } = useData()

  const [isRescoring, setIsRescoring] = useState(false)

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
    setIsRescoring(true)
    // TODO: Call AI scoring API
    setTimeout(() => setIsRescoring(false), 2000)
  }

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

  const qualityScore = lead.quality_score || 0
  const intentScore = lead.intent_score || 0
  const confidence = lead.ai_confidence || 0

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
          <ClassificationBadge score={qualityScore} size="lg" />
        </div>

        {/* Confidence + Rescore */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            AI Confidence: {confidence ? `${Math.round(confidence * 100)}%` : '-'}
          </span>
          <Button variant="ghost" size="sm" onClick={handleRescore} disabled={isRescoring}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isRescoring ? 'animate-spin' : ''}`} />
            {isRescoring ? 'Scoring...' : 'Re-score'}
          </Button>
        </div>
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
                {lead.ai_summary || 'No AI summary available. Click Re-score to generate.'}
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
              <p className="text-sm mb-3">{lead.ai_next_action || 'No action recommended'}</p>
              {lead.ai_next_action && (
                <Button size="sm">Do It</Button>
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
              {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 ? (
                <ul className="space-y-2">
                  {lead.ai_risk_flags.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recommendations yet</p>
              )}
            </CardContent>
          </Card>

          {/* Risk Flags */}
          {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {lead.ai_risk_flags.map((flag, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      {flag}
                    </li>
                  ))}
                </ul>
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
