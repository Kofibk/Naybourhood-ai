'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lead, LeadFilters as FilterState, PipelineStats, PriorityAction, LeadStatus } from '@/types'
import { LeadTable, LeadCardGrid } from '@/components/leads'
import { PipelineOverview } from '@/components/dashboard/PipelineOverview'
import { PriorityActions } from '@/components/dashboard/PriorityActions'
import {
  fetchLeads,
  fetchPipelineStats,
  fetchPriorityActions,
  bulkUpdateLeads,
} from '@/lib/queries/leads'
import { Plus, LayoutGrid, LayoutList, X, Users, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

// Status options for bulk change
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

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null)
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Bulk action modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('Contact Pending')
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Filters and sorting
  const [filters, setFilters] = useState<FilterState>({})
  const [sortBy, setSortBy] = useState('qualityScore')
  const [sortAsc, setSortAsc] = useState(false)

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)
  const [total, setTotal] = useState(0)

  // Get unique values for filters
  const availableAssignees = useMemo(() => {
    const assignees = new Set<string>()
    leads.forEach((l) => l.assignedCaller && assignees.add(l.assignedCaller))
    return Array.from(assignees).sort()
  }, [leads])

  const availableDevelopments = useMemo(() => {
    const developments = new Set<string>()
    leads.forEach((l) => l.developmentName && developments.add(l.developmentName))
    return Array.from(developments).sort()
  }, [leads])

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsResult, stats, actions] = await Promise.all([
        fetchLeads(filters, { page, pageSize }, sortBy, sortAsc),
        fetchPipelineStats(),
        fetchPriorityActions(undefined, 5),
      ])

      setLeads(leadsResult.leads)
      setTotal(leadsResult.total)
      setPipelineStats(stats)
      setPriorityActions(actions)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, sortBy, sortAsc])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleRowClick = (lead: Lead) => {
    router.push(`/admin/leads-new/${lead.id}`)
  }

  // Export leads to CSV
  const exportToCSV = (ids: string[]) => {
    const leadsToExport = leads.filter(l => ids.includes(l.id))
    if (leadsToExport.length === 0) {
      toast.error('No leads selected for export')
      return
    }

    // Define CSV headers
    const headers = [
      'Name', 'Email', 'Phone', 'Status', 'Quality Score', 'Intent Score',
      'Budget', 'Location', 'Bedrooms', 'Timeline', 'Source', 'Assigned To', 'Created At'
    ]

    // Map leads to CSV rows
    const rows = leadsToExport.map(lead => [
      lead.fullName || '',
      lead.email || '',
      lead.phone || '',
      lead.status || '',
      lead.qualityScore?.toString() || '',
      lead.intentScore?.toString() || '',
      lead.budgetRange || '',
      lead.location || '',
      lead.bedrooms?.toString() || '',
      lead.timeline || '',
      lead.source || '',
      lead.assignedCaller || '',
      lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''
    ])

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success(`Exported ${leadsToExport.length} leads to CSV`)
  }

  // Handle bulk assign
  const handleBulkAssign = async () => {
    if (!selectedAssignee || selectedIds.length === 0) return
    setBulkActionLoading(true)
    try {
      await bulkUpdateLeads(selectedIds, { assignedCaller: selectedAssignee })
      toast.success(`Assigned ${selectedIds.length} leads to ${selectedAssignee}`)
      setShowAssignModal(false)
      setSelectedIds([])
      loadData()
    } catch (error) {
      toast.error('Failed to assign leads')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Handle bulk status change
  const handleBulkStatusChange = async () => {
    if (!selectedStatus || selectedIds.length === 0) return
    setBulkActionLoading(true)
    try {
      await bulkUpdateLeads(selectedIds, { status: selectedStatus })
      toast.success(`Updated ${selectedIds.length} leads to "${selectedStatus}"`)
      setShowStatusModal(false)
      setSelectedIds([])
      loadData()
    } catch (error) {
      toast.error('Failed to update lead status')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkAction = async (action: string, ids: string[]) => {
    if (action === 'assign') {
      setSelectedIds(ids)
      setShowAssignModal(true)
    } else if (action === 'status') {
      setSelectedIds(ids)
      setShowStatusModal(true)
    } else if (action === 'export') {
      exportToCSV(ids)
    } else if (action === 'archive') {
      await bulkUpdateLeads(ids, { status: 'Not Proceeding' })
      toast.success(`Archived ${ids.length} leads`)
      loadData()
    }
  }

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(column)
      setSortAsc(false)
    }
  }

  const handleStageClick = (stage: keyof PipelineStats) => {
    // Map stage to status filter
    const stageToStatus: Record<string, string> = {
      contactPending: 'Contact Pending',
      followUp: 'Follow Up',
      viewingBooked: 'Viewing Booked',
      negotiating: 'Negotiating',
      reserved: 'Reserved',
    }
    setFilters({ ...filters, status: stageToStatus[stage] as FilterState['status'] })
    setPage(0)
  }

  const handleActionComplete = (actionId: string) => {
    setPriorityActions((prev) => prev.filter((a) => a.id !== actionId))
  }

  const handleQuickAction = (leadId: string, action: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    switch (action) {
      case 'call':
        if (lead.phone) {
          window.open(`tel:${lead.phone}`, '_self')
        } else {
          toast.error('No phone number available')
        }
        break
      case 'whatsapp':
        if (lead.phone) {
          const phone = lead.phone.replace(/\D/g, '')
          window.open(`https://wa.me/${phone}`, '_blank')
        } else {
          toast.error('No phone number available')
        }
        break
      case 'email':
        if (lead.email) {
          window.open(`mailto:${lead.email}`, '_self')
        } else {
          toast.error('No email address available')
        }
        break
      case 'view':
        router.push(`/admin/leads-new/${leadId}`)
        break
      default:
        router.push(`/admin/leads-new/${leadId}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your lead pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 rounded-r-none"
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 rounded-l-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Pipeline Overview */}
      {pipelineStats && (
        <PipelineOverview
          stats={pipelineStats}
          onStageClick={handleStageClick}
          loading={loading && !pipelineStats}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Priority Actions Sidebar */}
        <div className="lg:col-span-1">
          <PriorityActions
            actions={priorityActions}
            onComplete={handleActionComplete}
            onAction={(action) => router.push(`/admin/leads-new/${action.leadId}`)}
            loading={loading && priorityActions.length === 0}
          />
        </div>

        {/* Leads Table/Grid */}
        <div className="lg:col-span-3">
          {viewMode === 'table' ? (
            <LeadTable
              leads={leads}
              loading={loading}
              pagination={{ page, pageSize, total }}
              onPageChange={setPage}
              onRowClick={handleRowClick}
              onBulkAction={handleBulkAction}
              filters={filters}
              onFilterChange={(f) => {
                setFilters(f)
                setPage(0)
              }}
              sortBy={sortBy}
              sortAsc={sortAsc}
              onSortChange={handleSortChange}
              availableAssignees={availableAssignees}
              availableDevelopments={availableDevelopments}
              title="All Leads"
            />
          ) : (
            <div className="space-y-4">
              <LeadCardGrid
                leads={leads}
                onCardClick={handleRowClick}
                onQuickAction={handleQuickAction}
              />
              {/* Pagination for grid view */}
              {total > pageSize && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(page + 1) * pageSize >= total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {selectedIds.length} Leads</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Select Assignee</label>
            <select
              className="w-full mt-2 h-10 px-3 border rounded-md bg-background"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            >
              <option value="">Select an assignee...</option>
              {availableAssignees.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
            {availableAssignees.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No assignees found. Leads will be assigned to the name you enter.
              </p>
            )}
            <input
              type="text"
              className="w-full mt-2 h-10 px-3 border rounded-md bg-background"
              placeholder="Or enter a new assignee name..."
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!selectedAssignee || bulkActionLoading}
            >
              {bulkActionLoading ? 'Assigning...' : `Assign ${selectedIds.length} Leads`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status for {selectedIds.length} Leads</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Select New Status</label>
            <select
              className="w-full mt-2 h-10 px-3 border rounded-md bg-background"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusChange}
              disabled={!selectedStatus || bulkActionLoading}
            >
              {bulkActionLoading ? 'Updating...' : `Update ${selectedIds.length} Leads`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
