'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
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
} from 'lucide-react'

export default function BrokerFinanceLeadsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { financeLeads, isLoading, refreshData } = useData()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter finance leads by broker's company_id
  const myFinanceLeads = useMemo(() => {
    if (!user?.company_id) {
      // If user has no company_id, show empty state
      return []
    }
    return financeLeads.filter(lead => lead.company_id === user.company_id)
  }, [financeLeads, user?.company_id])

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

  // Stats
  const stats = useMemo(() => {
    return {
      total: myFinanceLeads.length,
      filtered: filteredLeads.length,
      contactPending: myFinanceLeads.filter(l => l.status === 'Contact Pending').length,
      followUp: myFinanceLeads.filter(l => l.status === 'Follow-up').length,
      awaitingDocs: myFinanceLeads.filter(l => l.status === 'Awaiting Documents').length,
      completed: myFinanceLeads.filter(l => l.status === 'Completed').length,
    }
  }, [myFinanceLeads, filteredLeads])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Contact Pending': return 'warning'
      case 'Follow-up': return 'default'
      case 'Awaiting Documents': return 'secondary'
      case 'Not Proceeding': return 'destructive'
      case 'Duplicate': return 'muted'
      case 'Completed': return 'success'
      default: return 'outline'
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
  if (!user?.company_id) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Finance Leads</h2>
          <p className="text-sm text-muted-foreground">
            {stats.filtered === stats.total
              ? `${stats.total} finance leads assigned to you`
              : `Showing ${stats.filtered} of ${stats.total} finance leads`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshData()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('Contact Pending')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Contact Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats.contactPending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('Follow-up')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Follow-up</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.followUp}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('Awaiting Documents')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Awaiting Docs</span>
            </div>
            <p className="text-2xl font-bold text-purple-500">{stats.awaitingDocs}</p>
          </CardContent>
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
          <option value="Contact Pending">Contact Pending</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Awaiting Documents">Awaiting Documents</option>
          <option value="Not Proceeding">Not Proceeding</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Finance Leads List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {myFinanceLeads.length === 0
                ? 'No finance leads assigned to you yet.'
                : 'No leads match your search criteria.'
              }
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/broker/finance-leads/${lead.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                      </h3>
                      <Badge variant={getStatusColor(lead.status) as any}>
                        {lead.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.finance_type && (
                        <Badge variant="outline" className="text-xs">
                          {lead.finance_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-bold">
                        <PoundSterling className="h-4 w-4" />
                        {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount).replace('£', '') : '-')}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Required by {formatDate(lead.required_by_date)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (lead.phone) window.open(`tel:${lead.phone}`)
                        }}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (lead.email) window.open(`mailto:${lead.email}`)
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/broker/finance-leads/${lead.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
