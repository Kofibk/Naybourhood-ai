'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Lead, LeadFilters as FilterState, LeadPagination } from '@/types'
import { StatusBadge, ClassificationBadge, PaymentBadge, NextActionChip } from '@/components/badges'
import { ScoreCell } from '@/components/scoring'
import { LeadFilters } from './LeadFilters'
import { BulkActions } from './BulkActions'
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const allSelected = leads.length > 0 && selectedIds.size === leads.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < leads.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkAction = (action: string) => {
    if (onBulkAction && selectedIds.size > 0) {
      onBulkAction(action, Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => {
    const isActive = sortBy === column
    return (
      <button
        onClick={() => onSortChange?.(column)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {children}
        {isActive ? (
          sortAsc ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    )
  }

  // Determine next action for a lead
  const getNextAction = (lead: Lead): string => {
    if (lead.status === 'Contact Pending') return 'call'
    if (lead.status === 'Follow Up') return lead.daysInStatus && lead.daysInStatus > 3 ? 're_engage' : 'email'
    if (lead.status === 'Viewing Booked') return 'confirm'
    if (lead.viewingIntentConfirmed && !lead.viewingBooked) return 'book_viewing'
    return 'follow_up'
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
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-3">
                  <SortHeader column="fullName">Lead</SortHeader>
                </th>
                <th className="p-3 w-16">
                  <SortHeader column="qualityScore">Q</SortHeader>
                </th>
                <th className="p-3 w-16">
                  <SortHeader column="intentScore">I</SortHeader>
                </th>
                <th className="p-3 w-20">Class</th>
                <th className="p-3">Budget</th>
                <th className="p-3">
                  <SortHeader column="status">Status</SortHeader>
                </th>
                <th className="p-3 w-24">Next</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={cn(
                      'border-b hover:bg-muted/50 transition-colors cursor-pointer',
                      selectedIds.has(lead.id) && 'bg-muted/30'
                    )}
                    onClick={() => onRowClick?.(lead)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{lead.fullName}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{lead.qualityScore}</td>
                    <td className="p-3 text-muted-foreground">{lead.intentScore}</td>
                    <td className="p-3">
                      <ClassificationBadge
                        classification={lead.classification}
                        showIcon={false}
                        size="sm"
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="text-sm">{lead.budgetRange || 'Not specified'}</div>
                        {lead.paymentMethod && (
                          <PaymentBadge method={lead.paymentMethod} showIcon={false} />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <StatusBadge status={lead.status} />
                        {lead.assignedCaller && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {lead.assignedCaller}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <NextActionChip action={getNextAction(lead)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && onPageChange && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.page * pagination.pageSize + 1}-
              {Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 0}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
