'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUsers } from '@/hooks/useUsers'
import { useLeads } from '@/hooks/useLeads'
import { EmailComposer } from '@/components/EmailComposer'
import { ConversationThread } from '@/components/ConversationThread'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import {
  parseBudgetRange,
  formatBudgetValue,
  formatDate,
} from '@/lib/leadUtils'
import {
  DataRow,
} from '@/components/leads/detail/LeadDisplayComponents'
import {
  EditableTextField,
  EditableBooleanField,
  EditableSelectField,
  EditableConnectionStatus,
} from '@/components/leads/detail/LeadEditableFields'
import { LeadHeader } from '@/components/leads/detail/LeadHeader'
import { LeadAIInsights } from '@/components/leads/detail/LeadAIInsights'
import { LeadSidebar } from '@/components/leads/detail/LeadSidebar'
import { TransactionTimeline } from '@/components/transactions'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Bot,
  MessageSquare,
  User,
  Building,
  Clock,
  DollarSign,
  MapPin,
  Hash,
  Globe,
  Briefcase,
  Home,
} from 'lucide-react'


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
      <div className="max-w-7xl mx-auto space-y-6">
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
  // Use null for unscored leads (will trigger auto-scoring)
  const qualityScore = scoreResult?.quality_score ?? lead.ai_quality_score ?? lead.quality_score
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <LeadHeader
        lead={lead}
        qualityScore={qualityScore}
        intentScore={intentScore}
        confidenceScore={confidenceScore}
        classification={classification}
        priority={priority}
        scoreReasons={scoreReasons}
        scoreResult={scoreResult}
        isRescoring={isRescoring}
        onRescore={handleRescore}
        onArchive={handleArchive}
      />

      {/* Transaction Pipeline */}
      <TransactionTimeline
        buyerId={lead.id}
        developmentId={lead.development_id}
        companyId={lead.company_id}
        qualityScore={qualityScore}
        intentScore={intentScore}
        confidence={confidenceScore}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          THREE COLUMN LAYOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1 - AI INSIGHTS & ACTIONS */}
        <LeadAIInsights
          lead={lead}
          summary={summary}
          nextAction={nextAction}
          recommendations={recommendations}
          riskFlags={riskFlags}
          scoreBreakdown={scoreBreakdown}
          onShowEmailComposer={() => setShowEmailComposer(true)}
        />

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 2 - BUYER PROFILE & REQUIREMENTS
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <EditableTextField label="Full Name" value={lead.full_name} field="full_name" onSave={handleFieldSave} icon={User} />
              <EditableTextField label="First Name" value={lead.first_name} field="first_name" onSave={handleFieldSave} />
              <EditableTextField label="Last Name" value={lead.last_name} field="last_name" onSave={handleFieldSave} />
              <EditableTextField label="Email" value={lead.email} field="email" onSave={handleFieldSave} icon={Mail} type="email" />
              <EditableTextField label="Phone" value={lead.phone} field="phone" onSave={handleFieldSave} icon={Phone} type="tel" />
              <EditableTextField label="Country" value={lead.country} field="country" onSave={handleFieldSave} icon={Globe} />
            </CardContent>
          </Card>

          {/* Property Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="w-4 h-4" />
                Property Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {(() => {
                // Parse budget range to auto-populate min/max if not set
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
            </CardContent>
          </Card>

          {/* Financial Qualification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Qualification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
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
            </CardContent>
          </Card>

          {/* Source & Campaign */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Source & Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <EditableTextField label="Source" value={lead.source_platform || lead.source} field="source_platform" onSave={handleFieldSave} />
              <EditableTextField label="Campaign/Development" value={lead.source_campaign || lead.campaign || lead.development_name} field="source_campaign" onSave={handleFieldSave} />
              <EditableTextField label="Development Name" value={lead.development_name} field="development_name" onSave={handleFieldSave} icon={Building} />
              <EditableTextField label="Enquiry Type" value={lead.enquiry_type} field="enquiry_type" onSave={handleFieldSave} />
              <DataRow label="Campaign ID" value={lead.campaign_id ? lead.campaign_id.substring(0, 8) + '...' : '-'} icon={Hash} />
              <DataRow label="Company ID" value={lead.company_id ? lead.company_id.substring(0, 8) + '...' : '-'} icon={Building} />
            </CardContent>
          </Card>

          {/* Engagement & Communication */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Engagement & Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <EditableBooleanField label="Viewing Intent" value={(lead as any).viewing_intent_confirmed} field="viewing_intent_confirmed" onSave={handleFieldSave} />
              <EditableBooleanField label="Viewing Booked" value={(lead as any).viewing_booked} field="viewing_booked" onSave={handleFieldSave} />
              <EditableTextField label="Viewing Date" value={(lead as any).viewing_date} field="viewing_date" onSave={handleFieldSave} icon={Calendar} />
              <EditableBooleanField label="Has Replied" value={(lead as any).replied} field="replied" onSave={handleFieldSave} />
              <EditableBooleanField label="Stop Comms" value={(lead as any).stop_agent_communication || (lead as any).stop_comms} field="stop_agent_communication" onSave={handleFieldSave} />
              <EditableTextField label="Next Follow-up" value={(lead as any).next_follow_up} field="next_follow_up" onSave={handleFieldSave} icon={Clock} />
              <EditableBooleanField label="Broker Connected" value={(lead as any).connect_to_broker || (lead as any).broker_connected} field="connect_to_broker" onSave={handleFieldSave} />
            </CardContent>
          </Card>

          {/* WhatsApp Conversation Thread */}
          <ConversationThread
            buyerId={lead.id}
            buyerName={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'}
            buyerPhone={lead.phone}
            channel="whatsapp"
            maxHeight="400px"
          />

          {/* Call Summary & Transcript */}
          {((lead as any).transcript || (lead as any).call_summary) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(lead as any).call_summary && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Call Summary</div>
                    <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">{(lead as any).call_summary}</div>
                  </div>
                )}
                {(lead as any).transcript && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Transcript</div>
                    <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{(lead as any).transcript}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUMN 3 - STATUS, NOTES & HISTORY */}
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

      {/* Email Composer Modal */}
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
