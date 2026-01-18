'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LeadFilters as FilterState, LeadClassification, LeadStatus } from '@/types'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableAssignees?: string[]
  availableDevelopments?: string[]
  className?: string
}

const classificationOptions: LeadClassification[] = ['Hot', 'Warm', 'Low']
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

export function LeadFilters({
  filters,
  onFilterChange,
  availableAssignees = [],
  availableDevelopments = [],
  className,
}: LeadFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    onFilterChange({})
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Classification Quick Filters */}
        <div className="flex items-center rounded-md border bg-background p-1">
          <Button
            variant={!filters.classification ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => clearFilter('classification')}
          >
            All
          </Button>
          {classificationOptions.map((c) => (
            <Button
              key={c}
              variant={filters.classification === c ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-3 text-xs',
                c === 'Hot' && 'text-red-500',
                c === 'Warm' && 'text-orange-500',
                c === 'Low' && 'text-gray-500'
              )}
              onClick={() => updateFilter('classification', c)}
            >
              {c}
            </Button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-3.5 w-3.5 mr-2" />
            Status
            {filters.status && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {filters.status}
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 ml-2" />
          </Button>
        </div>

        {/* Assignee Filter */}
        {availableAssignees.length > 0 && (
          <select
            value={filters.assignedCaller || ''}
            onChange={(e) =>
              e.target.value
                ? updateFilter('assignedCaller', e.target.value)
                : clearFilter('assignedCaller')
            }
            className="h-8 px-2 text-sm border rounded-md bg-background"
          >
            <option value="">All Assignees</option>
            {availableAssignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={filters.search || ''}
            onChange={(e) =>
              e.target.value ? updateFilter('search', e.target.value) : clearFilter('search')
            }
            className="h-8 pl-9 pr-8"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => clearFilter('search')}
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearAllFilters}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters (Status Grid) */}
      {showAdvanced && (
        <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Status</div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <Button
                key={s}
                variant={filters.status === s ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  filters.status === s ? clearFilter('status') : updateFilter('status', s)
                }
              >
                {s}
              </Button>
            ))}
          </div>

          {/* Development Filter */}
          {availableDevelopments.length > 0 && (
            <>
              <div className="text-xs font-medium text-muted-foreground mt-3">Development</div>
              <select
                value={filters.developmentName || ''}
                onChange={(e) =>
                  e.target.value
                    ? updateFilter('developmentName', e.target.value)
                    : clearFilter('developmentName')
                }
                className="w-full h-8 px-2 text-sm border rounded-md bg-background"
              >
                <option value="">All Developments</option>
                {availableDevelopments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {filters.classification && (
            <Badge variant="secondary" className="text-xs">
              {filters.classification}
              <button onClick={() => clearFilter('classification')} className="ml-1">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              {filters.status}
              <button onClick={() => clearFilter('status')} className="ml-1">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {filters.assignedCaller && (
            <Badge variant="secondary" className="text-xs">
              {filters.assignedCaller}
              <button onClick={() => clearFilter('assignedCaller')} className="ml-1">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {filters.developmentName && (
            <Badge variant="secondary" className="text-xs">
              {filters.developmentName}
              <button onClick={() => clearFilter('developmentName')} className="ml-1">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
