'use client'

import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  /** Search text value */
  search?: string
  /** Search change handler */
  onSearchChange?: (value: string) => void
  /** Search placeholder */
  searchPlaceholder?: string
  /** Quick filter segments (e.g., classification tabs) */
  segments?: {
    options: FilterOption[]
    value?: string
    onChange: (value: string | undefined) => void
    allLabel?: string
  }
  /** Active filter tags to display */
  activeFilters?: Array<{
    key: string
    label: string
    onRemove: () => void
  }>
  /** Clear all filters */
  onClearAll?: () => void
  /** Additional filter controls */
  children?: React.ReactNode
  className?: string
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  segments,
  activeFilters = [],
  onClearAll,
  children,
  className,
}: FilterBarProps) {
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Segmented filter (e.g., Hot/Warm/Low) */}
        {segments && (
          <div className="flex items-center rounded-md border bg-background p-1">
            <Button
              variant={!segments.value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => segments.onChange(undefined)}
            >
              {segments.allLabel || 'All'}
            </Button>
            {segments.options.map((opt) => (
              <Button
                key={opt.value}
                variant={segments.value === opt.value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => segments.onChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        )}

        {/* Additional filter controls */}
        {children}

        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search || ''}
              onChange={(e) => onSearchChange(e.target.value || '')}
              className="h-8 pl-9 pr-8"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Clear All */}
        {hasActiveFilters && onClearAll && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearAll}>
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="text-xs">
              {filter.label}
              <button onClick={filter.onRemove} className="ml-1">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
