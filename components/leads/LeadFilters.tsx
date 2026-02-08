'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterBar } from '@/components/ui/filter-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LeadFilters as FilterState, LeadClassification, LeadStatus } from '@/types'
import { Filter, ChevronDown } from 'lucide-react'
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

  // Build active filter tags
  const activeFilters = [
    filters.classification && {
      key: 'classification',
      label: filters.classification,
      onRemove: () => clearFilter('classification'),
    },
    filters.status && {
      key: 'status',
      label: filters.status,
      onRemove: () => clearFilter('status'),
    },
    filters.assignedCaller && {
      key: 'assignedCaller',
      label: filters.assignedCaller,
      onRemove: () => clearFilter('assignedCaller'),
    },
    filters.developmentName && {
      key: 'developmentName',
      label: filters.developmentName,
      onRemove: () => clearFilter('developmentName'),
    },
  ].filter(Boolean) as Array<{ key: string; label: string; onRemove: () => void }>

  return (
    <div className={cn('space-y-3', className)}>
      <FilterBar
        search={filters.search}
        onSearchChange={(val) => (val ? updateFilter('search', val) : clearFilter('search'))}
        searchPlaceholder="Search leads..."
        segments={{
          options: classificationOptions.map((c) => ({ label: c, value: c })),
          value: filters.classification,
          onChange: (val) => (val ? updateFilter('classification', val as LeadClassification) : clearFilter('classification')),
        }}
        activeFilters={activeFilters}
        onClearAll={() => onFilterChange({})}
      >
        {/* Status Dropdown Toggle */}
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

        {/* Assignee Filter */}
        {availableAssignees.length > 0 && (
          <Select
            value={filters.assignedCaller || ''}
            onValueChange={(val) => (val ? updateFilter('assignedCaller', val) : clearFilter('assignedCaller'))}
          >
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Assignees</SelectItem>
              {availableAssignees.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FilterBar>

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
              <Select
                value={filters.developmentName || ''}
                onValueChange={(val) => (val ? updateFilter('developmentName', val) : clearFilter('developmentName'))}
              >
                <SelectTrigger className="w-full h-8 text-sm">
                  <SelectValue placeholder="All Developments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Developments</SelectItem>
                  {availableDevelopments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}
    </div>
  )
}
