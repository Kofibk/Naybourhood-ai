'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { EmailComposer } from '@/components/EmailComposer'
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector'
import { LoadingState } from '@/components/ui/loading-state'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { KycStatusBadge } from '@/components/kyc/KycVerificationBanner'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import {
  Search, Phone, Mail, MessageCircle, Eye, Flame, Users,
  ChevronRight, Target, TrendingUp, CheckCircle, Clock,
  ArrowUp, ArrowDown, Archive, Copy, AlertTriangle, Settings2,
  FileText, Calendar, PoundSterling, RefreshCw, UserPlus,
} from 'lucide-react'
import { LeadIntakeForm } from '@/components/leads/LeadIntakeForm'

type LeadMode = 'property' | 'finance'

interface LeadManagementPageProps {
  mode: LeadMode
}

const PROPERTY_STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
]

const FINANCE_STATUS_OPTIONS = [
  'Contact Pending',
  'Follow-up',
  'Awaiting Documents',
  'Processing',
  'Approved',
  'Completed',
  'Not Proceeding',
]

const getPropertyClassificationColor = (classification: string | undefined) => {
  switch (classification) {
    case 'Hot': return 'bg-red-500 text-white'
    case 'Warm-Qualified': return 'bg-orange-500 text-white'
    case 'Warm-Engaged': return 'bg-amber-500 text-white'
    case 'Nurture': return 'bg-blue-400 text-white'
    case 'Cold': return 'bg-gray-400 text-white'
    default: return 'bg-gray-300 text-gray-700'
  }
}

const getPropertyStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Completed':
    case 'Exchanged': return 'bg-green-100 text-green-800 border-green-300'
    case 'Reserved':
    case 'Negotiating': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'Viewing Booked': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'Follow Up': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'Not Proceeding': return 'bg-red-100 text-red-800 border-red-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getFinanceStatusColor = (status?: string) => {
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

export function LeadManagementPage({ mode }: LeadManagementPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { leads: rqLeads, isLoading: leadsLoading, updateLead: rqUpdateLead, refreshLeads } = useLeads()
  const { financeLeads, isLoading: financeLoading, updateFinanceLead: rqUpdateFinanceLead, refreshFinanceLeads } = useFinanceLeads()
  const isLoading = leadsLoading || financeLoading

  const isPropertyMode = mode === 'property'
  const statusOptions = isPropertyMode ? PROPERTY_STATUS_OPTIONS : FINANCE_STATUS_OPTIONS
  const entityName = isPropertyMode ? 'Lead' : 'Borrower'
  const detailBasePath = isPropertyMode ? '/developer/buyers' : '/broker/borrowers'

  // State
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classificationFilter, setClassificationFilter] = useState<string>('all')
  const [emailLead, setEmailLead] = useState<any>(null)
  const [whatsappLead, setWhatsappLead] = useState<any>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'score' | 'newest' | 'oldest'>('score')
  const [showArchived, setShowArchived] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  // Finance mode: company initialization
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [companyName, setCompanyName] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(isPropertyMode)

  useEffect(() => {
    if (isPropertyMode) return
    const initializeCompany = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) currentUser = JSON.parse(stored)
        } catch { /* ignore */ }
      }
      if (!currentUser?.id) { setIsReady(true); return }
      if (currentUser.company_id) {
        setCompanyId(currentUser.company_id)
        if (currentUser.company) setCompanyName(currentUser.company)
        setIsReady(true)
        return
      }
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles').select('company_id').eq('id', currentUser.id).single()
        if (profile?.company_id) setCompanyId(profile.company_id)
      }
      setIsReady(true)
    }
    initializeCompany()
  }, [user, isPropertyMode])

  // Data source - use React Query for both property leads and finance leads
  const rawLeads = isPropertyMode ? rqLeads : financeLeads
  const updateLeadFn = isPropertyMode ? rqUpdateLead : rqUpdateFinanceLead

  // Filter leads by company
  const isAdmin = user?.role === 'admin'
  const myLeads = useMemo(() => {
    if (isPropertyMode) {
      if (isAdmin) return rawLeads
      if (!user?.company_id) return []
      return rawLeads.filter((lead: any) => lead.company_id === user.company_id)
    }
    // Finance mode
    if (rawLeads.length === 0) return []
    if (companyId || companyName) {
      return rawLeads.filter((lead: any) => {
        if (companyId && lead.company_id === companyId) return true
        if (companyName && lead.company?.toLowerCase() === companyName.toLowerCase()) return true
        return false
      })
    }
    return []
  }, [rawLeads, user?.company_id, isAdmin, isPropertyMode, companyId, companyName])

  // Apply filters and sorting
  const filteredLeads = useMemo(() => {
    const filtered = myLeads.filter((lead: any) => {
      if (!showArchived && (lead.is_archived || lead.is_duplicate || lead.is_fake)) return false

      const matchesSearch = !search ||
        lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search) ||
        lead.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.last_name?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesClassification = !isPropertyMode || classificationFilter === 'all' ||
        lead.ai_classification === classificationFilter

      return matchesSearch && matchesStatus && matchesClassification
    })

    return filtered.sort((a: any, b: any) => {
      if (sortOrder === 'score') {
        const scoreA = a.final_score ?? a.ai_quality_score ?? 0
        const scoreB = b.final_score ?? b.ai_quality_score ?? 0
        return scoreB - scoreA
      }
      const dateA = new Date(a.date_added || a.created_at || 0).getTime()
      const dateB = new Date(b.date_added || b.created_at || 0).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
  }, [myLeads, search, statusFilter, classificationFilter, sortOrder, showArchived, isPropertyMode])

  const toggleDateSort = useCallback(() => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  // Conversion funnel stats
  const stats = useMemo(() => {
    const total = myLeads.length
    if (isPropertyMode) {
      const hot = myLeads.filter((l: any) => l.ai_classification === 'Hot' || (l.ai_quality_score || l.quality_score || 0) >= 70).length
      const viewings = myLeads.filter((l: any) => l.status === 'Viewing Booked').length
      const negotiating = myLeads.filter((l: any) => l.status === 'Negotiating').length
      const reserved = myLeads.filter((l: any) => l.status === 'Reserved' || l.status === 'Exchanged').length
      const completed = myLeads.filter((l: any) => l.status === 'Completed').length
      const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0
      return { total, hot, viewings, negotiating, reserved, completed, conversionRate }
    }
    // Finance stats
    const completed = myLeads.filter((l: any) => l.status === 'Completed' || l.status === 'Approved').length
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      total,
      contactPending: myLeads.filter((l: any) => l.status === 'Contact Pending').length,
      followUp: myLeads.filter((l: any) => l.status === 'Follow-up').length,
      awaitingDocs: myLeads.filter((l: any) => l.status === 'Awaiting Documents').length,
      completed,
      conversionRate,
    }
  }, [myLeads, isPropertyMode])

  // Status change handler
  const handleStatusChange = async (leadId: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setUpdatingStatus(leadId)
    try {
      if (updateLeadFn) {
        await updateLeadFn(leadId, { status: newStatus })
        toast.success(`Status updated to ${newStatus}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Quick action handlers
  const handleQuickCall = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) window.location.href = `tel:${lead.phone}`
    else toast.error('No phone number available')
  }

  const handleQuickEmail = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) setEmailLead(lead)
    else toast.error('No email address available')
  }

  const handleQuickWhatsApp = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) setWhatsappLead(lead)
    else toast.error('No phone number available')
  }

  // Archive/duplicate/fake handlers
  const handleMarkAsArchived = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateLeadFn) {
        await updateLeadFn(leadId, { is_archived: true })
        toast.success(`${entityName} archived`)
      }
    } catch (error) {
      console.error(`Error archiving ${entityName.toLowerCase()}:`, error)
      toast.error(`Failed to archive ${entityName.toLowerCase()}`)
    }
  }

  const handleMarkAsDuplicate = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateLeadFn) {
        await updateLeadFn(leadId, { is_duplicate: true })
        toast.success(`${entityName} marked as duplicate`)
      }
    } catch (error) {
      console.error(`Error marking ${entityName.toLowerCase()} as duplicate:`, error)
      toast.error(`Failed to mark ${entityName.toLowerCase()} as duplicate`)
    }
  }

  const handleMarkAsFake = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateLeadFn) {
        await updateLeadFn(leadId, { is_fake: true })
        toast.success(`${entityName} marked as fake`)
      }
    } catch (error) {
      console.error(`Error marking ${entityName.toLowerCase()} as fake:`, error)
      toast.error(`Failed to mark ${entityName.toLowerCase()} as fake`)
    }
  }

  const handleRestoreLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionMenuOpen(null)
    try {
      if (updateLeadFn) {
        await updateLeadFn(leadId, { is_archived: false, is_duplicate: false, is_fake: false })
        toast.success(`${entityName} restored`)
      }
    } catch (error) {
      console.error(`Error restoring ${entityName.toLowerCase()}:`, error)
      toast.error(`Failed to restore ${entityName.toLowerCase()}`)
    }
  }

  const getLeadName = (lead: any) =>
    lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'

  // Loading states — show skeleton loaders instead of blank screen
  if (!isReady || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-3">
              <div className="animate-pulse">
                <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                <div className="h-7 w-10 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4">
              <div className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-white/10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-white/10 rounded" />
                  <div className="h-3 w-48 bg-white/5 rounded" />
                </div>
                <div className="h-6 w-20 bg-white/10 rounded-full" />
                <div className="h-8 w-16 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // No company state
  const hasNoCompany = isPropertyMode
    ? (!user?.company_id && user?.role !== 'admin')
    : !companyId

  if (hasNoCompany) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">
            {isPropertyMode ? 'Lead Management' : 'Borrowers'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isPropertyMode ? 'Manage and convert your leads' : 'Manage your assigned borrowers'}
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Your account is not linked to a company{!isPropertyMode ? ' yet' : ''}.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isPropertyMode
                ? 'Contact an administrator to assign you to a company.'
                : 'Please contact an administrator to assign you to a company.'}
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
          <h2 className="text-2xl font-bold font-display">
            {isPropertyMode ? 'Lead Management' : 'Borrowers'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isPropertyMode
              ? 'Manage and convert your leads to completed sales'
              : 'Manage and convert your borrowers'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPropertyMode && (
            <Button
              variant="success"
              size="sm"
              onClick={() => router.push('/developer/buyers/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Buyer
            </Button>
          )}
          {isPropertyMode && <LeadIntakeForm />}
          {!isPropertyMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => isPropertyMode ? refreshLeads() : refreshFinanceLeads()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {'Refresh'}
            </Button>
          )}
        </div>
      </div>

      {/* Conversion Funnel Stats */}
      {isPropertyMode ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Leads</div>
            <div className="text-2xl font-bold">{(stats as any).total}</div>
          </Card>
          <Card className="p-3 border-red-200 bg-red-50">
            <div className="text-xs text-red-600 flex items-center gap-1">
              <Flame className="h-3 w-3" /> Hot Leads
            </div>
            <div className="text-2xl font-bold text-red-600">{(stats as any).hot}</div>
          </Card>
          <Card className="p-3 border-purple-200 bg-purple-50">
            <div className="text-xs text-purple-600">Viewings</div>
            <div className="text-2xl font-bold text-purple-600">{(stats as any).viewings}</div>
          </Card>
          <Card className="p-3 border-blue-200 bg-blue-50">
            <div className="text-xs text-blue-600">Negotiating</div>
            <div className="text-2xl font-bold text-blue-600">{(stats as any).negotiating}</div>
          </Card>
          <Card className="p-3 border-amber-200 bg-amber-50">
            <div className="text-xs text-amber-600">Reserved</div>
            <div className="text-2xl font-bold text-amber-600">{(stats as any).reserved}</div>
          </Card>
          <Card className="p-3 border-green-200 bg-green-50">
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="p-3 cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('all')}>
            <div className="text-xs text-muted-foreground">Total Leads</div>
            <div className="text-2xl font-bold">{(stats as any).total}</div>
          </Card>
          <Card className="p-3 border-yellow-200 bg-yellow-50 cursor-pointer" onClick={() => setStatusFilter('Contact Pending')}>
            <div className="text-xs text-yellow-600 flex items-center gap-1">
              <Phone className="h-3 w-3" /> Contact Pending
            </div>
            <div className="text-2xl font-bold text-yellow-600">{(stats as any).contactPending}</div>
          </Card>
          <Card className="p-3 border-blue-200 bg-blue-50 cursor-pointer" onClick={() => setStatusFilter('Follow-up')}>
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Follow-up
            </div>
            <div className="text-2xl font-bold text-blue-600">{(stats as any).followUp}</div>
          </Card>
          <Card className="p-3 border-purple-200 bg-purple-50 cursor-pointer" onClick={() => setStatusFilter('Awaiting Documents')}>
            <div className="text-xs text-purple-600 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Awaiting Docs
            </div>
            <div className="text-2xl font-bold text-purple-600">{(stats as any).awaitingDocs}</div>
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
      )}

      {/* Classification Filter Tabs (property mode only) */}
      {isPropertyMode && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[
            { value: 'all', label: 'All' },
            { value: 'Hot', label: 'Hot Leads' },
            { value: 'Warm-Qualified', label: 'Qualified' },
            { value: 'Warm-Engaged', label: 'Needs Qualification' },
            { value: 'Nurture', label: 'Nurture' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setClassificationFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                classificationFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {statusOptions.map(s => (
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

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isPropertyMode && <Target className="h-4 w-4 text-primary" />}
              {isPropertyMode ? `Your Leads (${filteredLeads.length})` : `Borrowers (${filteredLeads.length})`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && rawLeads.length === 0 ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-muted rounded" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {myLeads.length === 0
                ? `No ${entityName.toLowerCase()}s assigned yet`
                : `No ${entityName.toLowerCase()}s match your filters`}
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-3 font-medium min-w-[180px]">
                      {isPropertyMode ? 'Lead' : 'Client'}
                    </th>
                    {isPropertyMode && (
                      <th
                        className="pb-3 font-medium cursor-pointer hover:text-foreground transition-colors min-w-[90px]"
                        onClick={() => setSortOrder(sortOrder === 'score' ? 'newest' : 'score')}
                      >
                        <div className="flex items-center gap-1">
                          NB Score
                          {sortOrder === 'score' && <ArrowDown className="h-3 w-3" />}
                        </div>
                      </th>
                    )}
                    {isPropertyMode && (
                      <th className="pb-3 font-medium min-w-[120px]">Classification</th>
                    )}
                    {isPropertyMode && (
                      <th className="pb-3 font-medium min-w-[130px]">Development</th>
                    )}
                    <th className="pb-3 font-medium min-w-[120px]">
                      {isPropertyMode ? 'Budget' : 'Loan Amount'}
                    </th>
                    {isPropertyMode && (
                      <th className="pb-3 font-medium min-w-[100px]">Timeline</th>
                    )}
                    {isPropertyMode ? (
                      <th className="pb-3 font-medium min-w-[180px]">Next Action</th>
                    ) : (
                      <th className="pb-3 font-medium min-w-[160px]">Status</th>
                    )}
                    <th
                      className="pb-3 font-medium cursor-pointer hover:text-foreground transition-colors min-w-[100px]"
                      onClick={toggleDateSort}
                    >
                      <div className="flex items-center gap-1">
                        Date Added
                        {sortOrder === 'newest' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : sortOrder === 'oldest' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : null}
                      </div>
                    </th>
                    {!isPropertyMode && (
                      <th className="pb-3 font-medium min-w-[110px]">Required By</th>
                    )}
                    <th className="pb-3 font-medium text-right min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead: any) => (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`${detailBasePath}/${lead.id}`)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3">
                        <div className="font-medium flex items-center gap-2">
                          {isPropertyMode && lead.ai_classification === 'Hot' && <Flame className="h-4 w-4 text-red-500" />}
                          {getLeadName(lead)}
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
                          {!isPropertyMode && lead.finance_type && ` \u2022 ${lead.finance_type}`}
                        </div>
                      </td>
                      {/* NB Score — coloured number/badge */}
                      {isPropertyMode && (
                        <td className="py-3">
                          {(lead.final_score ?? lead.ai_quality_score) != null ? (
                            <span
                              className="inline-flex items-center justify-center text-sm font-bold rounded-full w-10 h-10"
                              style={{
                                color: getNBScoreColor(lead.final_score ?? lead.ai_quality_score ?? 0),
                                backgroundColor: `${getNBScoreColor(lead.final_score ?? lead.ai_quality_score ?? 0)}15`,
                              }}
                            >
                              {lead.final_score ?? lead.ai_quality_score}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      )}
                      {/* Classification badge */}
                      {isPropertyMode && (
                        <td className="py-3">
                          <Badge className={`text-xs ${getPropertyClassificationColor(lead.ai_classification)}`}>
                            {lead.ai_classification || 'Unscored'}
                          </Badge>
                        </td>
                      )}
                      {/* Development name */}
                      {isPropertyMode && (
                        <td className="py-3">
                          <span className="text-sm truncate max-w-[130px] block">
                            {lead.development_name || lead.campaign || '-'}
                          </span>
                        </td>
                      )}
                      {/* Budget / Loan Amount */}
                      <td className="py-3">
                        {isPropertyMode ? (
                          <span className="text-sm">{lead.budget || lead.budget_range || '-'}</span>
                        ) : (
                          <div className="flex items-center gap-1 font-medium">
                            <PoundSterling className="h-3 w-3" />
                            {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount).replace('\u00a3', '') : '-')}
                          </div>
                        )}
                      </td>
                      {/* Timeline (property only) */}
                      {isPropertyMode && (
                        <td className="py-3">
                          <span className="text-xs text-muted-foreground">{lead.timeline || lead.timeline_to_purchase || '-'}</span>
                        </td>
                      )}
                      {/* Next Action / Status */}
                      {isPropertyMode ? (
                        <td className="py-3">
                          <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">
                            {lead.ai_next_action || 'Contact to confirm interest'}
                          </span>
                        </td>
                      ) : (
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status || 'Contact Pending'}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value, e as any)}
                            disabled={updatingStatus === lead.id}
                            className={`text-xs px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors min-w-[140px] font-medium ${
                              getFinanceStatusColor(lead.status)
                            }`}
                          >
                            {statusOptions.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      )}
                      {/* Date Added */}
                      <td className="py-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(lead.date_added || lead.created_at)}
                        </span>
                      </td>
                      {/* Required By (finance only) */}
                      {!isPropertyMode && (
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(lead.required_by_date)}
                          </div>
                        </td>
                      )}
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {lead.phone && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => handleQuickCall(lead, e)} title="Call">
                                <Phone className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => handleQuickWhatsApp(lead, e)} title="WhatsApp">
                                <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            </>
                          )}
                          {lead.email && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => handleQuickEmail(lead, e)} title="Email">
                              <Mail className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                          )}
                          {/* Actions Dropdown */}
                          <div className="relative">
                            <Button
                              variant="ghost" size="sm" className="h-7 w-7 p-0"
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
                                    Restore {entityName}
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
                            variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={(e) => { e.stopPropagation(); router.push(`${detailBasePath}/${lead.id}`) }}
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
          recipientName={getLeadName(emailLead)}
          leadId={emailLead.id}
          developmentName={isPropertyMode ? emailLead.campaign : undefined}
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
          recipientName={getLeadName(whatsappLead)}
          leadStage={whatsappLead.status || 'Contact Pending'}
          developmentName={isPropertyMode ? whatsappLead.campaign : undefined}
          agentName={user?.name || ''}
          companyName="Naybourhood"
        />
      )}
    </div>
  )
}
