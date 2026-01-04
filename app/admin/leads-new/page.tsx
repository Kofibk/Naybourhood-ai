'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Lead, LeadFilters as FilterState, PipelineStats, PriorityAction } from '@/types'
import { LeadTable, LeadCardGrid } from '@/components/leads'
import { PipelineOverview } from '@/components/dashboard/PipelineOverview'
import { PriorityActions } from '@/components/dashboard/PriorityActions'
import {
  fetchLeads,
  fetchPipelineStats,
  fetchPriorityActions,
  bulkUpdateLeads,
} from '@/lib/queries/leads'
import { Plus, LayoutGrid, LayoutList } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null)
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

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

  const handleBulkAction = async (action: string, ids: string[]) => {
    if (action === 'assign') {
      // TODO: Show assign modal
      console.log('Assign', ids)
    } else if (action === 'status') {
      // TODO: Show status change modal
      console.log('Change status', ids)
    } else if (action === 'export') {
      // TODO: Export to CSV
      console.log('Export', ids)
    } else if (action === 'archive') {
      await bulkUpdateLeads(ids, { status: 'Not Proceeding' })
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
    // TODO: Implement quick actions
    console.log('Quick action', leadId, action)
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
    </div>
  )
}
