'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { Lead, LeadFilters as FilterState, LeadPagination } from '@/types'
import { ClassificationBadge, PaymentBadge, NextActionChip } from '@/components/badges'
import { KycStatusBadge } from '@/components/kyc/KycVerificationBanner'
import { NBScoreInline } from '@/components/scoring/NBScoreHero'
import { LeadFilters } from './LeadFilters'
import { BulkActions } from './BulkActions'
import { Users } from 'lucide-react'

interface LeadTableProps {
  leads: Lead[]
  loading?: boolean
  pagination?: LeadPagination
  onPageChange?: (page: number) => void
  onRowClick?: (lead: Lead) => void
  onBulkAction?: (action: string, ids: string[]) => void
  filters?: FilterState
  onFilterChange?: (filters: FilterState) => void
  sortBy?: string
  sortAsc?: boolean
  onSortChange?: (column: string) => void
  availableAssignees?: string[]
  availableDevelopments?: string[]
  showFilters?: boolean
  showBulkActions?: boolean
  title?: string
  className?: string
}

// Determine next action for a lead
function getNextAction(lead: Lead): string {
  if (lead.status === 'Contact Pending') return 'call'
  if (lead.status === 'Follow Up') return lead.daysInStatus && lead.daysInStatus > 3 ? 're_engage' : 'email'
  if (lead.status === 'Viewing Booked') return 'confirm'
  if (lead.viewingIntentConfirmed && !lead.viewingBooked) return 'book_viewing'
  return 'follow_up'
}

const columns: DataTableColumn<Lead>[] = [
  {
    id: 'fullName',
    header: 'Lead',
    sortable: true,
    cell: (lead) => (
      <div>
        <div className="font-medium">{lead.fullName}</div>
        <div className="text-xs text-muted-foreground">{lead.phone}</div>
      </div>
    ),
  },
  {
    id: 'nbScore',
    header: 'NB',
    sortable: true,
    className: 'w-16',
    cell: (lead) => (
      <NBScoreInline qualityScore={lead.qualityScore} intentScore={lead.intentScore} />
    ),
  },
  {
    id: 'classification',
    header: 'Class',
    className: 'w-24',
    cell: (lead) => (
      <ClassificationBadge classification={lead.classification} size="sm" />
    ),
  },
  {
    id: 'budget',
    header: 'Budget',
    cell: (lead) => (
      <div>
        <div className="text-sm">{lead.budgetRange || 'Not specified'}</div>
        {lead.paymentMethod && <PaymentBadge method={lead.paymentMethod} showIcon={false} />}
      </div>
    ),
  },
  {
    id: 'kycStatus',
    header: 'Verified',
    className: 'w-24',
    cell: (lead) => (
      <KycStatusBadge status={lead.kycStatus ?? 'not_started'} />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: (lead) => (
      <div>
        <StatusBadge status={lead.status} />
        {lead.assignedCaller && (
          <div className="text-xs text-muted-foreground mt-1">{lead.assignedCaller}</div>
        )}
      </div>
    ),
  },
  {
    id: 'nextAction',
    header: 'Next',
    className: 'w-24',
    cell: (lead) => (
      <div onClick={(e) => e.stopPropagation()}>
        <NextActionChip action={getNextAction(lead)} />
      </div>
    ),
  },
]

export function LeadTable({
  leads,
  loading = false,
  pagination,
  onPageChange,
  onRowClick,
  onBulkAction,
  filters = {},
  onFilterChange,
  sortBy = 'qualityScore',
  sortAsc = false,
  onSortChange,
  availableAssignees = [],
  availableDevelopments = [],
  showFilters = true,
  showBulkActions = true,
  title,
  className,
}: LeadTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedIds.size > 0) {
      onBulkAction(action, Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && onFilterChange && (
          <LeadFilters
            filters={filters}
            onFilterChange={onFilterChange}
            availableAssignees={availableAssignees}
            availableDevelopments={availableDevelopments}
          />
        )}

        {/* Bulk Actions */}
        {showBulkActions && selectedIds.size > 0 && (
          <BulkActions
            selectedCount={selectedIds.size}
            onAction={handleBulkAction}
            onClear={() => setSelectedIds(new Set())}
          />
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          data={leads}
          getRowId={(lead) => lead.id}
          loading={loading}
          sortBy={sortBy}
          sortAsc={sortAsc}
          onSortChange={onSortChange}
          pagination={pagination}
          onPageChange={onPageChange}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={onRowClick}
          emptyTitle="No leads found"
          emptyDescription="Try adjusting your filters"
          emptyIcon={Users}
        />
      </CardContent>
    </Card>
  )
}
