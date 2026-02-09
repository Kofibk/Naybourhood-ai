'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lead, LeadStatus } from '@/types'
import { StatusBadge } from '@/components/ui/status-badge'
import { ScoreIndicator } from '@/components/ui/score-indicator'
import { ClassificationBadge, PaymentBadge } from '@/components/badges'
import {
  ArrowLeft,
  Edit,
  Archive,
  RefreshCw,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  MapPin,
  Banknote,
  Home,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bot,
  Target,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KycVerificationBanner, KycStatusBadge } from '@/components/kyc/KycVerificationBanner'
import { useKycCheck } from '@/hooks/useKycCheck'

interface LeadDetailProps {
  lead: Lead
  onBack?: () => void
  onUpdate?: (updates: Partial<Lead>) => void
  onRescore?: () => void
  canEdit?: boolean
  className?: string
}

const statusOptions: LeadStatus[] = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Disqualified',
]

export function LeadDetail({
  lead,
  onBack,
  onUpdate,
  onRescore,
  canEdit = true,
  className,
}: LeadDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [rescoring, setRescoring] = useState(false)
  const { kycCheck } = useKycCheck(lead.id)

  const handleStatusChange = (status: LeadStatus) => {
    onUpdate?.({ status })
  }

  const handleRescore = async () => {
    setRescoring(true)
    await onRescore?.()
    setRescoring(false)
  }

  const CheckIcon = ({ checked }: { checked?: boolean }) =>
    checked ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    )

  // Connection status icon for broker/solicitor (handles string values)
  const ConnectionIcon = ({ status }: { status?: string | boolean }) => {
    // Handle boolean values (legacy)
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <span className="h-4 w-4 text-muted-foreground">—</span>
      )
    }
    // Handle string values
    if (status === 'yes' || status === 'introduced') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (status === 'no') {
      return <XCircle className="h-4 w-4 text-red-400" />
    }
    // unknown or undefined
    return <span className="h-4 w-4 text-muted-foreground inline-flex items-center justify-center">—</span>
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 self-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </Button>
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lead Header Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{lead.fullName}</h1>
                <KycStatusBadge status={kycCheck?.status ?? 'not_started'} />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                {lead.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {lead.email}
                  </span>
                )}
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {lead.phone}
                  </span>
                )}
                {lead.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {lead.country}
                  </span>
                )}
              </div>
            </div>

            {/* Score Display */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <ScoreIndicator value={lead.qualityScore} label="Quality" size="md" />
                <ScoreIndicator value={lead.intentScore} label="Intent" size="md" />
                <ClassificationBadge classification={lead.classification} />
                {lead.aiConfidence !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round((lead.aiConfidence ?? 0) * 100)}% conf.
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleRescore}
                disabled={rescoring}
              >
                <RefreshCw className={cn('h-3 w-3 mr-1', rescoring && 'animate-spin')} />
                Re-score
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Verification Banner */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - AI & Communication */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {lead.aiSummary || 'No AI summary available. Click Re-score to generate.'}
              </p>

              {/* Next Action */}
              {lead.aiNextAction && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-primary mb-1">
                        <Target className="h-3 w-3 inline mr-1" />
                        Next Action
                      </div>
                      <div className="text-sm">{lead.aiNextAction}</div>
                    </div>
                    <Button size="sm">Do It</Button>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {lead.aiRecommendations && lead.aiRecommendations.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Recommendations
                  </div>
                  <ul className="space-y-1">
                    {lead.aiRecommendations.map((rec, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Flags */}
              {lead.aiRiskFlags && lead.aiRiskFlags.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-warning mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Flags
                  </div>
                  <ul className="space-y-1">
                    {lead.aiRiskFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-warning flex items-start gap-2">
                        <span>•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viewing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Viewing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Intent Confirmed</span>
                <CheckIcon checked={lead.viewingIntentConfirmed} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Viewing Booked</span>
                <CheckIcon checked={lead.viewingBooked} />
              </div>
              {lead.viewingDate && (
                <div className="text-sm text-muted-foreground">
                  Date: {new Date(lead.viewingDate).toLocaleDateString()}
                </div>
              )}
              <Button className="w-full" disabled={lead.viewingBooked}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Viewing
              </Button>
            </CardContent>
          </Card>

          {/* Communication History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Communication History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.transcript ? (
                <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
                  {lead.transcript.split('\n').map((line, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-2 rounded',
                        line.toLowerCase().startsWith('buyer')
                          ? 'bg-muted'
                          : line.toLowerCase().startsWith('agent')
                          ? 'bg-primary/10'
                          : ''
                      )}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No conversation history</p>
              )}

              {lead.lastWaMessage && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Last WhatsApp</div>
                  <div className="text-sm italic">&ldquo;{lead.lastWaMessage}&rdquo;</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Buyer Profile & Status */}
        <div className="space-y-6">
          {/* Buyer Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Buyer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">{lead.budgetRange || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment</span>
                {lead.paymentMethod ? (
                  <PaymentBadge method={lead.paymentMethod} />
                ) : (
                  <span>Not specified</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bedrooms</span>
                <span>{lead.bedrooms || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span>{lead.location || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Purpose</span>
                <span>{lead.purpose || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Timeline</span>
                <span>{lead.timeline || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ready 28 Days</span>
                <CheckIcon checked={lead.readyIn28Days} />
              </div>

              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Match</span>
                  <CheckIcon checked={lead.budgetMatch} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bedroom Match</span>
                  <CheckIcon checked={lead.bedroomMatch} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                {canEdit ? (
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                    className="w-full mt-1 h-9 px-3 border rounded-md bg-background text-sm"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1">
                    <StatusBadge status={lead.status} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assigned</span>
                <span>{lead.assignedCaller || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Days in Status</span>
                <span>{lead.daysInStatus || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SLA Met</span>
                <CheckIcon checked={lead.slaMet} />
              </div>

              <div className="pt-3 border-t">
                {lead.developmentName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Development</span>
                    <span>{lead.developmentName}</span>
                  </div>
                )}
                {lead.source && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Source</span>
                    <span>{lead.source}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Follow-up */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next</span>
                <span>
                  {lead.nextFollowUp
                    ? new Date(lead.nextFollowUp).toLocaleDateString()
                    : 'Not scheduled'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Replied</span>
                <CheckIcon checked={lead.replied} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stop Comms</span>
                <CheckIcon checked={lead.stopComms} />
              </div>
            </CardContent>
          </Card>

          {/* Broker */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Broker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connected</span>
                <CheckIcon checked={lead.brokerConnected} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">UK Broker</span>
                <ConnectionIcon status={lead.ukBroker} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">UK Solicitor</span>
                <ConnectionIcon status={lead.ukSolicitor} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Proof of Funds</span>
                <CheckIcon checked={lead.proofOfFunds} />
              </div>
              <Button variant="outline" className="w-full" disabled={lead.brokerConnected}>
                Refer to Broker
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
