'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
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
  ArrowUp,
  ArrowDown,
  Archive,
  Copy,
  AlertTriangle,
  Settings2,
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
  const { financeLeads, isLoading, isSyncing, refreshData, updateFinanceLead } = useData()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [emailLead, setEmailLead] = useState<any>(null)
  const [whatsappLead, setWhatsappLead] = useState<any>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [showArchived, setShowArchived] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  // Fetch company_id from localStorage or user_profiles
  useEffect(() => {
    const initializeCompany = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            currentUser = JSON.parse(stored)
          }
        } catch { /* ignore */ }
      }

      if (!currentUser?.id) {
        setIsReady(true)
        return
      }

      if (currentUser.company_id) {
        setCompanyId(currentUser.company_id)
        setIsReady(true)
        return
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      }

      setIsReady(true)
    }

    initializeCompany()
  }, [user])

  // Filter borrowers by broker's company_id
  const myFinanceLeads = useMemo(() => {
    console.log('[BrokerBorrowers] Total borrowers from DB:', financeLeads.length)
    console.log('[BrokerBorrowers] Company ID:', companyId)

    // If no borrowers at all, return empty
    if (financeLeads.length === 0) {
      return []
    }

    // If user has a company_id, filter by it
    if (companyId) {
      const filtered = financeLeads.filter(lead => lead.company_id === companyId)
      console.log('[BrokerBorrowers] Filtered by company:', filtered.length)
      return filtered
    }

    // No company_id - return empty (require company assignment)
    return []
  }, [financeLeads, companyId])

  // Apply search, status filter, and sorting
  const filteredLeads = useMemo(() => {
    const filtered = myFinanceLeads.filter(lead => {
      // Hide archived/duplicate/fake leads unless showArchived is true
      if (!showArchived) {
        if (lead.is_archived || lead.is_duplicate || lead.is_fake) {
          return false
        }
      }

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

    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
  }, [myFinanceLeads, search, statusFilter, sortOrder, showArchived])

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')
  }, [])

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

  const handleMarkAsArchived = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateFinanceLead) {
        await updateFinanceLead(leadId, { is_archived: true })
        toast.success('Borrower archived')
      }
    } catch (error) {
      console.error('Error archiving borrower:', error)
      toast.error('Failed to archive borrower')
    }
  }

  const handleMarkAsDuplicate = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateFinanceLead) {
        await updateFinanceLead(leadId, { is_duplicate: true })
        toast.success('Borrower marked as duplicate')
      }
    } catch (error) {
      console.error('Error marking borrower as duplicate:', error)
      toast.error('Failed to mark borrower as duplicate')
    }
  }

  const handleMarkAsFake = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateFinanceLead) {
        await updateFinanceLead(leadId, { is_fake: true })
        toast.success('Borrower marked as fake')
      }
    } catch (error) {
      console.error('Error marking borrower as fake:', error)
      toast.error('Failed to mark borrower as fake')
    }
  }

  const handleRestoreLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateFinanceLead) {
        await updateFinanceLead(leadId, { is_archived: false, is_duplicate: false, is_fake: false })
        toast.success('Borrower restored')
      }
    } catch (error) {
      console.error('Error restoring borrower:', error)
      toast.error('Failed to restore borrower')
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

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // If user has no company_id, show message
  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Borrowers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your assigned borrowers
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Borrowers</h2>
          <p className="text-sm text-muted-foreground">
            Manage and convert your borrowers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshData()}
          disabled={isLoading || isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* Conversion Funnel Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-3 cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('all')}>
          <div className="text-xs text-muted-foreground">Total Leads</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-3 border-yellow-200 bg-yellow-50 cursor-pointer" onClick={() => setStatusFilter('Contact Pending')}>
          <div className="text-xs text-yellow-600 flex items-center gap-1">
            <Phone className="h-3 w-3" /> Contact Pending
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.contactPending}</div>
        </Card>
        <Card className="p-3 border-blue-200 bg-blue-50 cursor-pointer" onClick={() => setStatusFilter('Follow-up')}>
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Follow-up
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.followUp}</div>
        </Card>
        <Card className="p-3 border-purple-200 bg-purple-50 cursor-pointer" onClick={() => setStatusFilter('Awaiting Documents')}>
          <div className="text-xs text-purple-600 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Awaiting Docs
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.awaitingDocs}</div>
        </Card>
        <Card className="p-3 border-green-200 bg-green-50 cursor-pointer" onClick={() => setStatusFilter('Completed')}>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Completed
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card className="p-3 border-primary/50 bg-primary/5">
          <div className="text-xs text-primary flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Conv. Rate
          </div>
          <div className="text-2xl font-bold text-primary">{stats.conversionRate}%</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-9"
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
        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className="whitespace-nowrap"
        >
          <Archive className="h-4 w-4 mr-2" />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Borrowers Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Borrowers ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && financeLeads.length === 0 ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {myFinanceLeads.length === 0
                ? 'No borrowers assigned yet'
                : 'No borrowers match your filters'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Client</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Loan Amount</th>
                    <th
                      className="pb-2 font-medium cursor-pointer hover:text-foreground transition-colors"
                      onClick={toggleSortOrder}
                    >
                      <div className="flex items-center gap-1">
                        Date Added
                        {sortOrder === 'newest' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                    <th className="pb-2 font-medium">Required By</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/broker/borrowers/${lead.id}`)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-medium flex items-center gap-2">
                          {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                          {lead.is_archived && (
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">Archived</Badge>
                          )}
                          {lead.is_duplicate && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-600">Duplicate</Badge>
                          )}
                          {lead.is_fake && (
                            <Badge variant="outline" className="text-xs bg-red-100 text-red-600">Fake</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lead.email || ''}
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
                        <span className="text-xs text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </span>
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
                          {/* Actions Dropdown */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionMenuOpen(actionMenuOpen === lead.id ? null : lead.id)
                              }}
                              title="More Actions"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                            </Button>
                            {actionMenuOpen === lead.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(lead.is_archived || lead.is_duplicate || lead.is_fake) ? (
                                  <button
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 rounded-lg"
                                    onClick={(e) => handleRestoreLead(lead.id, e)}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Restore Borrower
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 rounded-t-lg"
                                      onClick={(e) => handleMarkAsArchived(lead.id, e)}
                                    >
                                      <Archive className="h-4 w-4 text-gray-500" />
                                      Archive
                                    </button>
                                    <button
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                      onClick={(e) => handleMarkAsDuplicate(lead.id, e)}
                                    >
                                      <Copy className="h-4 w-4 text-blue-500" />
                                      Mark as Duplicate
                                    </button>
                                    <button
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 rounded-b-lg text-red-600"
                                      onClick={(e) => handleMarkAsFake(lead.id, e)}
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                      Mark as Fake
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/broker/borrowers/${lead.id}`)
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
