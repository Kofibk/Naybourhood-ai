'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lead, PriorityAction, LeadStatus } from '@/types'
import { LeadTable } from '@/components/leads'
import { AgentStats } from '@/components/dashboard/AgentStats'
import { PriorityActionsCompact } from '@/components/dashboard/PriorityActions'
import { EmailComposer } from '@/components/EmailComposer'
import { fetchMyLeads, fetchPriorityActions, updateLeadStatus } from '@/lib/queries/leads'
import { Target, ChevronRight, Phone, Mail, MessageCircle, CheckCircle, Calendar, ChevronDown } from 'lucide-react'
import { KycStatusBadge } from '@/components/kyc/KycVerificationBanner'
import { toast } from 'sonner'

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

const getClassificationColor = (classification: string | undefined) => {
  switch (classification) {
    case 'Hot': return 'bg-red-500 text-white'
    case 'Warm-Qualified': return 'bg-orange-500 text-white'
    case 'Warm-Engaged': return 'bg-amber-500 text-white'
    case 'Nurture': return 'bg-blue-400 text-white'
    case 'Cold': return 'bg-gray-400 text-white'
    default: return 'bg-gray-300 text-gray-700'
  }
}

export default function AgentMyLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const [emailLead, setEmailLead] = useState<Lead | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    // Get user from localStorage
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setUserName(user.name || '')
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!userName) return

      setLoading(true)
      try {
        const [leadsData, actionsData] = await Promise.all([
          fetchMyLeads(userName),
          fetchPriorityActions(userName, 5),
        ])

        setLeads(leadsData)
        setPriorityActions(actionsData)
      } catch (error) {
        console.error('Error loading leads:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userName])

  const handleRowClick = (lead: Lead) => {
    router.push(`/agent/my-leads/${lead.id}`)
  }

  const handleActionComplete = (actionId: string) => {
    setPriorityActions((prev) => prev.filter((a) => a.id !== actionId))
  }

  const handleAction = (action: PriorityAction) => {
    router.push(`/agent/my-leads/${action.leadId}`)
  }

  const handleStatusChange = async (leadId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setUpdatingStatus(leadId)

    try {
      await updateLeadStatus(leadId, newStatus)
      // Update local state
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as LeadStatus } : l))
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleQuickCall = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`
    } else {
      toast.error('No phone number available')
    }
  }

  const handleQuickEmail = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) {
      setEmailLead(lead)
    } else {
      toast.error('No email address available')
    }
  }

  const handleQuickWhatsApp = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      const phone = lead.phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${phone}`, '_blank')
    } else {
      toast.error('No phone number available')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Leads</h1>
        <p className="text-sm text-muted-foreground">
          Your assigned leads and priority actions
        </p>
      </div>

      {/* Stats */}
      <AgentStats leads={leads} />

      {/* Priority Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Today&apos;s Priority
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          ) : priorityActions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No priority actions for today
            </p>
          ) : (
            <PriorityActionsCompact
              actions={priorityActions}
              onComplete={handleActionComplete}
              onAction={handleAction}
            />
          )}
        </CardContent>
      </Card>

      {/* Leads Table with Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
            <span className="text-xs text-muted-foreground">{leads.length} leads</span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No leads assigned to you yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Lead</th>
                    <th className="pb-2 font-medium">Classification</th>
                    <th className="pb-2 font-medium">Verified</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Next Action</th>
                    <th className="pb-2 font-medium text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleRowClick(lead)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-medium">{lead.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          Q{lead.qualityScore || 0}/I{lead.intentScore || 0}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={`text-xs ${getClassificationColor(lead.classification)}`}>
                          {lead.classification || 'Unscored'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <KycStatusBadge status={lead.kycStatus ?? 'not_started'} />
                      </td>
                      <td className="py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status || 'Contact Pending'}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value, e as any)}
                          disabled={updatingStatus === lead.id}
                          className="text-xs px-2 py-1 rounded border border-input bg-background cursor-pointer hover:bg-muted transition-colors"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[150px]">
                          {lead.aiNextAction || 'Follow up'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {lead.phone && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleQuickCall(lead, e)}
                                title="Call"
                              >
                                <Phone className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleQuickWhatsApp(lead, e)}
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            </>
                          )}
                          {lead.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => handleQuickEmail(lead, e)}
                              title="Email"
                            >
                              <Mail className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/agent/my-leads/${lead.id}`)
                            }}
                            title="View Details"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Composer Modal */}
      {emailLead && (
        <EmailComposer
          open={!!emailLead}
          onOpenChange={(open) => !open && setEmailLead(null)}
          recipientEmail={emailLead.email || ''}
          recipientName={emailLead.fullName || 'Lead'}
          leadId={emailLead.id}
          developmentName={emailLead.campaign}
        />
      )}
    </div>
  )
}
