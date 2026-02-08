'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { EmptyState } from './empty-state'
import { LoadingState } from './loading-state'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  id: string
  header: string | React.ReactNode
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  /** Unique key extractor for each row */
  getRowId: (row: T) => string
  /** Loading state */
  loading?: boolean
  /** Sort configuration */
  sortBy?: string
  sortAsc?: boolean
  onSortChange?: (column: string) => void
  /** Pagination */
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
  onPageChange?: (page: number) => void
  /** Row selection */
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  /** Row click handler */
  onRowClick?: (row: T) => void
  /** Empty state */
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  /** Custom className */
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  sortBy,
  sortAsc = false,
  onSortChange,
  pagination,
  onPageChange,
  selectable = false,
  selectedIds,
  onSelectionChange,
  onRowClick,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyIcon,
  className,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds?.size === data.length
  const someSelected = (selectedIds?.size ?? 0) > 0 && !allSelected

  const toggleSelectAll = () => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data.map(getRowId)))
    }
  }

  const toggleSelect = (id: string) => {
    if (!onSelectionChange || !selectedIds) return
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    onSelectionChange(newSet)
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
          sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead key={col.id} className={col.className}>
                {col.sortable && onSortChange ? (
                  <SortHeader column={col.id}>{col.header}</SortHeader>
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                <LoadingState text="Loading..." />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  icon={emptyIcon}
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const id = getRowId(row)
              const isSelected = selectedIds?.has(id) ?? false
              return (
                <TableRow
                  key={id}
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-muted/30'
                  )}
                  onClick={() => onRowClick?.(row)}
                  data-state={isSelected ? 'selected' : undefined}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(id)}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination && onPageChange && !loading && data.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Showing {pagination.page * pagination.pageSize + 1}-
            {Math.min((pagination.page + 1) * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total.toLocaleString()}
          </div>
          <div className="flex items-center justify-center gap-2">
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
    </div>
  )
}
