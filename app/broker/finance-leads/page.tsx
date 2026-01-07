'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { EmailComposer } from '@/components/EmailComposer'
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Search,
  Phone,
  Mail,
  Eye,
  Users,
  RefreshCw,
  Clock,
  FileText,
  Calendar,
  PoundSterling,
  MessageCircle,
  CheckCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'

const FINANCE_STATUS_OPTIONS = [
  'Contact Pending',
  'Follow-up',
  'Awaiting Documents',
  'Processing',
  'Approved',
  'Completed',
  'Not Proceeding',
]

export default function BrokerFinanceLeadsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { financeLeads, isLoading, refreshData, updateFinanceLead } = useData()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [emailLead, setEmailLead] = useState<any>(null)
  const [whatsappLead, setWhatsappLead] = useState<any>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Filter finance leads by broker's company_id
  // For testing, show all leads if company is 'mph-company' or if user has test email
  const myFinanceLeads = useMemo(() => {
    if (!user?.company_id) {
      if (user?.email?.includes('test') || user?.email?.includes('demo')) {
        return financeLeads
      }
      return []
    }
    if (user.company_id === 'mph-company') {
      return financeLeads
    }
    return financeLeads.filter(lead => lead.company_id === user.company_id)
  }, [financeLeads, user?.company_id, user?.email])

  // Apply search and status filter
  const filteredLeads = useMemo(() => {
    return myFinanceLeads.filter(lead => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          lead.full_name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search) ||
          lead.first_name?.toLowerCase().includes(searchLower) ||
          lead.last_name?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [myFinanceLeads, search, statusFilter])

  // Stats with conversion tracking
  const stats = useMemo(() => {
    const total = myFinanceLeads.length
    const completed = myFinanceLeads.filter(l => l.status === 'Completed' || l.status === 'Approved').length
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      filtered: filteredLeads.length,
      contactPending: myFinanceLeads.filter(l => l.status === 'Contact Pending').length,
      followUp: myFinanceLeads.filter(l => l.status === 'Follow-up').length,
      awaitingDocs: myFinanceLeads.filter(l => l.status === 'Awaiting Documents').length,
      processing: myFinanceLeads.filter(l => l.status === 'Processing' || l.status === 'Approved').length,
      completed,
      conversionRate,
    }
  }, [myFinanceLeads, filteredLeads])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Contact Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Follow-up': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Awaiting Documents': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Processing': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'Approved': return 'bg-green-100 text-green-800 border-green-300'
      case 'Completed': return 'bg-green-200 text-green-900 border-green-400'
      case 'Not Proceeding': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUpdatingStatus(leadId)

    try {
      if (updateFinanceLead) {
        await updateFinanceLead(leadId, { status: newStatus })
        toast.success(`Status updated to ${newStatus}`)
      } else {
        toast.error('Update function not available')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleQuickCall = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`
    } else {
      toast.error('No phone number available')
    }
  }

  const handleQuickEmail = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) {
      setEmailLead(lead)
    } else {
      toast.error('No email address available')
    }
  }

  const handleQuickWhatsApp = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      setWhatsappLead(lead)
    } else {
      toast.error('No phone number available')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // If user has no company_id, show message
  if (!user?.company_id && !user?.email?.includes('test') && !user?.email?.includes('demo')) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Finance Leads</h2>
          <p className="text-sm text-muted-foreground">
            Manage your assigned finance leads
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Your account is not linked to a company yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please contact an administrator to assign you to a company.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display">Finance Leads</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            {stats.total} leads • {stats.conversionRate}% conversion
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshData()}
          disabled={isLoading}
          className="h-8 px-2 md:px-3"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline ml-2">Refresh</span>
        </Button>
      </div>

      {/* Conversion Funnel Stats - scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 min-w-max md:min-w-0">
          <Card className="p-2 md:p-3 cursor-pointer hover:border-primary/50 min-w-[90px] md:min-w-0" onClick={() => setStatusFilter('all')}>
            <div className="text-[10px] md:text-xs text-muted-foreground">Total</div>
            <div className="text-lg md:text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-2 md:p-3 border-yellow-200 bg-yellow-50 cursor-pointer min-w-[90px] md:min-w-0" onClick={() => setStatusFilter('Contact Pending')}>
            <div className="text-[10px] md:text-xs text-yellow-600 flex items-center gap-1">
              <Phone className="h-3 w-3" /> <span className="hidden md:inline">Contact</span> Pending
            </div>
            <div className="text-lg md:text-2xl font-bold text-yellow-600">{stats.contactPending}</div>
          </Card>
          <Card className="p-2 md:p-3 border-blue-200 bg-blue-50 cursor-pointer min-w-[90px] md:min-w-0" onClick={() => setStatusFilter('Follow-up')}>
            <div className="text-[10px] md:text-xs text-blue-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Follow-up
            </div>
            <div className="text-lg md:text-2xl font-bold text-blue-600">{stats.followUp}</div>
          </Card>
          <Card className="p-2 md:p-3 border-purple-200 bg-purple-50 cursor-pointer min-w-[90px] md:min-w-0" onClick={() => setStatusFilter('Awaiting Documents')}>
            <div className="text-[10px] md:text-xs text-purple-600 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Docs
            </div>
            <div className="text-lg md:text-2xl font-bold text-purple-600">{stats.awaitingDocs}</div>
          </Card>
          <Card className="p-2 md:p-3 border-green-200 bg-green-50 cursor-pointer min-w-[90px] md:min-w-0" onClick={() => setStatusFilter('Completed')}>
            <div className="text-[10px] md:text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Done
            </div>
            <div className="text-lg md:text-2xl font-bold text-green-600">{stats.completed}</div>
          </Card>
          <Card className="p-2 md:p-3 border-primary/50 bg-primary/5 min-w-[90px] md:min-w-0">
            <div className="text-[10px] md:text-xs text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Rate
            </div>
            <div className="text-lg md:text-2xl font-bold text-primary">{stats.conversionRate}%</div>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {FINANCE_STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Finance Leads */}
      <Card>
        <CardHeader className="py-2 md:pb-3">
          <CardTitle className="text-sm font-medium">
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {isLoading ? (
            <div className="animate-pulse space-y-2 p-4 md:p-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {myFinanceLeads.length === 0
                ? 'No finance leads assigned yet'
                : 'No leads match your filters'}
            </p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/broker/finance-leads/${lead.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {lead.email && <span className="truncate block">{lead.email}</span>}
                          {lead.finance_type && <span className="block">{lead.finance_type}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <select
                            value={lead.status || 'Contact Pending'}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleStatusChange(lead.id, e.target.value, e as any)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingStatus === lead.id}
                            className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer ${getStatusColor(lead.status)}`}
                          >
                            {FINANCE_STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <span className="font-medium text-xs flex items-center gap-0.5">
                            <PoundSterling className="h-3 w-3" />
                            {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount).replace('£', '') : '-')}
                          </span>
                          {lead.required_by_date && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Calendar className="h-3 w-3" />
                              {formatDate(lead.required_by_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleQuickCall(lead, e)}
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {lead.email && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleQuickEmail(lead, e)}
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Loan Amount</th>
                      <th className="pb-2 font-medium">Required By</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => router.push(`/broker/finance-leads/${lead.id}`)}
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3">
                          <div className="font-medium">
                            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lead.email && lead.email}
                            {lead.finance_type && ` • ${lead.finance_type}`}
                          </div>
                        </td>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || 'Contact Pending'}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value, e as any)}
                            disabled={updatingStatus === lead.id}
                            className={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${getStatusColor(lead.status)}`}
                          >
                            {FINANCE_STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 font-medium">
                            <PoundSterling className="h-3 w-3" />
                            {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount).replace('£', '') : '-')}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(lead.required_by_date)}
                          </div>
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
                                router.push(`/broker/finance-leads/${lead.id}`)
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Composer Modal */}
      {emailLead && (
        <EmailComposer
          open={!!emailLead}
          onOpenChange={(open) => !open && setEmailLead(null)}
          recipientEmail={emailLead.email || ''}
          recipientName={emailLead.full_name || `${emailLead.first_name || ''} ${emailLead.last_name || ''}`.trim() || 'Client'}
          leadId={emailLead.id}
          leadStage={emailLead.status || 'Contact Pending'}
          agentName={user?.name || ''}
          companyName="Naybourhood"
        />
      )}

      {/* WhatsApp Template Selector Modal */}
      {whatsappLead && (
        <WhatsAppTemplateSelector
          open={!!whatsappLead}
          onOpenChange={(open) => !open && setWhatsappLead(null)}
          recipientPhone={whatsappLead.phone || ''}
          recipientName={whatsappLead.full_name || `${whatsappLead.first_name || ''} ${whatsappLead.last_name || ''}`.trim() || 'Client'}
          leadStage={whatsappLead.status || 'Contact Pending'}
          agentName={user?.name || ''}
          companyName="Naybourhood"
        />
      )}
    </div>
  )
}
