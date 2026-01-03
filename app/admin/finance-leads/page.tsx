'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import type { FinanceLead } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  Search,
  Filter,
  Phone,
  Mail,
  Eye,
  Flame,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Download,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  UserPlus,
  Plus,
  Trash2,
  PoundSterling,
  CreditCard,
  Building,
  Percent,
} from 'lucide-react'

type SortField = 'full_name' | 'quality_score' | 'loan_amount' | 'property_value' | 'ltv' | 'credit_score' | 'status' | 'created_at' | 'source'
type SortDirection = 'asc' | 'desc'
type GroupBy = 'none' | 'status' | 'source' | 'loan_type' | 'employment_status'

// Filter types for Airtable-style filtering
type FilterOperator =
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_any_of'
  | 'is_none_of'

type FilterFieldType = 'text' | 'number' | 'select' | 'date' | 'currency'

interface FilterField {
  key: string
  label: string
  type: FilterFieldType
  options?: string[]
}

interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: string | string[]
}

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: string
}

// Define all filterable fields with their types
const FILTER_FIELDS: FilterField[] = [
  { key: 'full_name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'loan_amount', label: 'Loan Amount', type: 'currency' },
  { key: 'loan_type', label: 'Loan Type', type: 'select', options: ['Purchase', 'Remortgage', 'Buy to Let', 'Bridging', 'Commercial', 'Development'] },
  { key: 'property_value', label: 'Property Value', type: 'currency' },
  { key: 'ltv', label: 'LTV %', type: 'number' },
  { key: 'credit_score', label: 'Credit Score', type: 'number' },
  { key: 'employment_status', label: 'Employment', type: 'select', options: ['Employed', 'Self-Employed', 'Director', 'Contractor', 'Retired', 'Unemployed'] },
  { key: 'income', label: 'Income', type: 'currency' },
  { key: 'quality_score', label: 'Quality Score', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Application', 'Approved', 'Completed', 'Declined', 'Lost'] },
  { key: 'source', label: 'Source', type: 'select', options: ['Facebook', 'Google', 'Instagram', 'Referral', 'Website', 'Broker', 'Other'] },
  { key: 'campaign', label: 'Campaign', type: 'text' },
  { key: 'created_at', label: 'Created Date', type: 'date' },
]

// Operators available per field type
const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'less_than', label: '<' },
    { value: 'greater_or_equal', label: '≥' },
    { value: 'less_or_equal', label: '≤' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  currency: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'less_than', label: '<' },
    { value: 'greater_or_equal', label: '≥' },
    { value: 'less_or_equal', label: '≤' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'is_any_of', label: 'is any of' },
    { value: 'is_none_of', label: 'is none of' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  date: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'greater_than', label: 'is after' },
    { value: 'less_than', label: 'is before' },
    { value: 'greater_or_equal', label: 'is on or after' },
    { value: 'less_or_equal', label: 'is on or before' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'full_name', label: 'Name', visible: true, width: 'w-[180px]' },
  { key: 'email', label: 'Email', visible: true, width: 'w-[180px]' },
  { key: 'phone', label: 'Phone', visible: true, width: 'w-[130px]' },
  { key: 'loan_amount', label: 'Loan Amount', visible: true, width: 'w-[120px]' },
  { key: 'loan_type', label: 'Loan Type', visible: true, width: 'w-[110px]' },
  { key: 'property_value', label: 'Property Value', visible: true, width: 'w-[120px]' },
  { key: 'ltv', label: 'LTV', visible: true, width: 'w-[70px]' },
  { key: 'credit_score', label: 'Credit', visible: true, width: 'w-[80px]' },
  { key: 'quality_score', label: 'Q Score', visible: true, width: 'w-[80px]' },
  { key: 'status', label: 'Status', visible: true, width: 'w-[100px]' },
  { key: 'source', label: 'Source', visible: false, width: 'w-[100px]' },
  { key: 'employment_status', label: 'Employment', visible: false, width: 'w-[110px]' },
  { key: 'income', label: 'Income', visible: false, width: 'w-[100px]' },
  { key: 'campaign', label: 'Campaign', visible: false, width: 'w-[130px]' },
  { key: 'created_at', label: 'Created', visible: false, width: 'w-[100px]' },
]

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

export default function FinanceLeadsPage() {
  const router = useRouter()
  const { financeLeads, isLoading, refreshData } = useData()

  // Search state
  const [search, setSearch] = useState('')

  // Advanced filter conditions (Airtable-style)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>('and')

  // Sort state
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Group state
  const [groupBy, setGroupBy] = useState<GroupBy>('none')

  // Column visibility
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Add a new filter condition
  const addFilterCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: 'full_name',
      operator: 'contains',
      value: '',
    }
    setFilterConditions([...filterConditions, newCondition])
  }, [filterConditions])

  // Update a filter condition
  const updateFilterCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setFilterConditions(filterConditions.map((c) => {
      if (c.id !== id) return c

      // If field changed, reset operator to first valid operator for new field type
      if (updates.field && updates.field !== c.field) {
        const fieldConfig = FILTER_FIELDS.find((f) => f.key === updates.field)
        const operators = OPERATORS_BY_TYPE[fieldConfig?.type || 'text']
        return {
          ...c,
          ...updates,
          operator: operators[0].value,
          value: fieldConfig?.type === 'select' && fieldConfig.options ? '' : '',
        }
      }

      return { ...c, ...updates }
    }))
  }, [filterConditions])

  // Remove a filter condition
  const removeFilterCondition = useCallback((id: string) => {
    setFilterConditions(filterConditions.filter((c) => c.id !== id))
  }, [filterConditions])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterConditions([])
    setSearch('')
  }, [])

  // Check if a lead matches a single filter condition
  const matchesCondition = useCallback((lead: FinanceLead, condition: FilterCondition): boolean => {
    const fieldConfig = FILTER_FIELDS.find((f) => f.key === condition.field)
    if (!fieldConfig) return true

    // Get the raw value from the lead
    let rawValue: any = (lead as any)[condition.field]

    // Special handling for full_name
    if (condition.field === 'full_name') {
      rawValue = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || ''
    }

    const value = rawValue?.toString().toLowerCase() || ''
    const conditionValue = typeof condition.value === 'string' ? condition.value.toLowerCase() : ''

    switch (condition.operator) {
      case 'contains':
        return value.includes(conditionValue)
      case 'not_contains':
        return !value.includes(conditionValue)
      case 'equals':
        if (fieldConfig.type === 'number' || fieldConfig.type === 'currency') {
          return Number(rawValue) === Number(condition.value)
        }
        return value === conditionValue
      case 'not_equals':
        if (fieldConfig.type === 'number' || fieldConfig.type === 'currency') {
          return Number(rawValue) !== Number(condition.value)
        }
        return value !== conditionValue
      case 'starts_with':
        return value.startsWith(conditionValue)
      case 'ends_with':
        return value.endsWith(conditionValue)
      case 'is_empty':
        return !rawValue || rawValue === '' || rawValue === null || rawValue === undefined
      case 'is_not_empty':
        return rawValue && rawValue !== '' && rawValue !== null && rawValue !== undefined
      case 'greater_than':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) > new Date(condition.value as string)
        }
        return Number(rawValue) > Number(condition.value)
      case 'less_than':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) < new Date(condition.value as string)
        }
        return Number(rawValue) < Number(condition.value)
      case 'greater_or_equal':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) >= new Date(condition.value as string)
        }
        return Number(rawValue) >= Number(condition.value)
      case 'less_or_equal':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) <= new Date(condition.value as string)
        }
        return Number(rawValue) <= Number(condition.value)
      case 'is_any_of':
        const anyOfValues = Array.isArray(condition.value) ? condition.value : [condition.value]
        return anyOfValues.some((v) => v.toLowerCase() === value)
      case 'is_none_of':
        const noneOfValues = Array.isArray(condition.value) ? condition.value : [condition.value]
        return !noneOfValues.some((v) => v.toLowerCase() === value)
      default:
        return true
    }
  }, [])

  // Filter leads based on all conditions
  const filteredLeads = useMemo(() => {
    return financeLeads.filter((lead) => {
      // Text search
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

      // Advanced filter conditions
      if (filterConditions.length > 0) {
        if (filterLogic === 'and') {
          return filterConditions.every((condition) => matchesCondition(lead, condition))
        } else {
          return filterConditions.some((condition) => matchesCondition(lead, condition))
        }
      }

      return true
    })
  }, [financeLeads, search, filterConditions, filterLogic, matchesCondition])

  // Sort leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]

      // Handle numeric values
      if (['quality_score', 'loan_amount', 'property_value', 'ltv', 'credit_score', 'income'].includes(sortField)) {
        aVal = aVal || 0
        bVal = bVal || 0
      }

      // Handle date strings
      if (sortField === 'created_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      // Handle strings
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLeads, sortField, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(sortedLeads.length / pageSize)
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedLeads.slice(start, end)
  }, [sortedLeads, currentPage, pageSize])

  // Reset to page 1 when filters change
  const filterKey = `${search}-${JSON.stringify(filterConditions)}-${filterLogic}`
  useMemo(() => {
    if (currentPage !== 1) setCurrentPage(1)
  }, [filterKey])

  // Group leads
  const groupedLeads = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Finance Leads': paginatedLeads }
    }

    const groups: Record<string, FinanceLead[]> = {}
    sortedLeads.forEach((lead) => {
      const groupValue = ((lead as any)[groupBy] as string) || 'Uncategorized'
      if (!groups[groupValue]) {
        groups[groupValue] = []
      }
      groups[groupValue].push(lead)
    })

    return groups
  }, [sortedLeads, groupBy, paginatedLeads])

  // Stats
  const stats = useMemo(() => {
    const totalLoanValue = financeLeads.reduce((sum, l) => sum + (l.loan_amount || 0), 0)
    const avgLTV = financeLeads.length > 0
      ? Math.round(financeLeads.reduce((sum, l) => sum + (l.ltv || 0), 0) / financeLeads.length)
      : 0

    return {
      total: financeLeads.length,
      filtered: filteredLeads.length,
      hot: financeLeads.filter((l) => (l.quality_score || 0) >= 80).length,
      new: financeLeads.filter((l) => l.status === 'New').length,
      qualified: financeLeads.filter((l) => l.status === 'Qualified' || l.status === 'Application').length,
      totalLoanValue,
      avgLTV,
    }
  }, [financeLeads, filteredLeads])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleColumn = (key: string) => {
    setColumns(columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    ))
  }

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 80) return 'text-orange-500'
    if (score >= 60) return 'text-success'
    return 'text-muted-foreground'
  }

  const getCreditColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 750) return 'text-success'
    if (score >= 650) return 'text-warning'
    return 'text-destructive'
  }

  const getLTVColor = (ltv: number | undefined) => {
    if (!ltv) return 'text-muted-foreground'
    if (ltv <= 60) return 'text-success'
    if (ltv <= 80) return 'text-warning'
    return 'text-destructive'
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'New': return 'warning'
      case 'Contacted': return 'secondary'
      case 'Qualified': return 'success'
      case 'Application': return 'default'
      case 'Approved': return 'success'
      case 'Completed': return 'success'
      case 'Declined': return 'destructive'
      case 'Lost': return 'destructive'
      default: return 'muted'
    }
  }

  const visibleColumns = columns.filter((c) => c.visible)
  const hasActiveFilters = filterConditions.length > 0 || search.length > 0

  // Quick filter presets
  const applyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'hot':
        setFilterConditions([{
          id: generateId(),
          field: 'quality_score',
          operator: 'greater_or_equal',
          value: '80',
        }])
        break
      case 'new':
        setFilterConditions([{
          id: generateId(),
          field: 'status',
          operator: 'equals',
          value: 'New',
        }])
        break
      case 'qualified':
        setFilterConditions([{
          id: generateId(),
          field: 'status',
          operator: 'is_any_of',
          value: ['Qualified', 'Application'],
        }])
        break
      default:
        setFilterConditions([])
    }
    setShowFilters(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Finance Leads</h2>
          <p className="text-sm text-muted-foreground">
            {stats.filtered === stats.total
              ? `${stats.total.toLocaleString()} total finance leads`
              : `Showing ${stats.filtered.toLocaleString()} of ${stats.total.toLocaleString()} finance leads`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => clearFilters()}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('hot')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Hot</span>
            </div>
            <p className="text-xl font-bold text-orange-500">{stats.hot}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('new')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">New</span>
            </div>
            <p className="text-xl font-bold text-blue-500">{stats.new}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('qualified')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            <p className="text-xl font-bold text-success">{stats.qualified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loan Value</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.totalLoanValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg LTV</span>
            </div>
            <p className="text-xl font-bold">{stats.avgLTV}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filtered</span>
            </div>
            <p className="text-xl font-bold">{stats.filtered.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {filterConditions.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {filterConditions.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowColumnSettings(!showColumnSettings)}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Columns
            </Button>
            <select
              className="px-3 py-2 rounded-md border border-input bg-background text-sm"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="none">No Grouping</option>
              <option value="status">Group by Status</option>
              <option value="source">Group by Source</option>
              <option value="loan_type">Group by Loan Type</option>
              <option value="employment_status">Group by Employment</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Panel (Airtable-style) */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Filter conditions</span>
                  {filterConditions.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Match</span>
                      <select
                        className="px-2 py-1 rounded-md border border-input bg-background text-xs"
                        value={filterLogic}
                        onChange={(e) => setFilterLogic(e.target.value as 'and' | 'or')}
                      >
                        <option value="and">ALL conditions (AND)</option>
                        <option value="or">ANY condition (OR)</option>
                      </select>
                    </div>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Filter Conditions */}
              <div className="space-y-2">
                {filterConditions.map((condition, index) => {
                  const fieldConfig = FILTER_FIELDS.find((f) => f.key === condition.field)
                  const operators = OPERATORS_BY_TYPE[fieldConfig?.type || 'text']
                  const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator)
                  const isMultiSelect = ['is_any_of', 'is_none_of'].includes(condition.operator)

                  return (
                    <div key={condition.id} className="flex items-center gap-2 flex-wrap">
                      {index > 0 && (
                        <span className="text-xs text-muted-foreground w-10">
                          {filterLogic === 'and' ? 'AND' : 'OR'}
                        </span>
                      )}
                      {index === 0 && <span className="w-10 text-xs text-muted-foreground">Where</span>}

                      {/* Field Select */}
                      <select
                        className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                        value={condition.field}
                        onChange={(e) => updateFilterCondition(condition.id, { field: e.target.value })}
                      >
                        {FILTER_FIELDS.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label}
                          </option>
                        ))}
                      </select>

                      {/* Operator Select */}
                      <select
                        className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                        value={condition.operator}
                        onChange={(e) => updateFilterCondition(condition.id, { operator: e.target.value as FilterOperator })}
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Value Input */}
                      {needsValue && (
                        <>
                          {fieldConfig?.type === 'select' && !isMultiSelect ? (
                            <select
                              className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                              value={condition.value as string}
                              onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                            >
                              <option value="">Select...</option>
                              {fieldConfig.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : fieldConfig?.type === 'select' && isMultiSelect ? (
                            <div className="flex flex-wrap gap-1 min-w-[200px]">
                              {fieldConfig.options?.map((opt) => {
                                const values = Array.isArray(condition.value) ? condition.value : []
                                const isSelected = values.includes(opt)
                                return (
                                  <Button
                                    key={opt}
                                    variant={isSelected ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const newValues = isSelected
                                        ? values.filter((v) => v !== opt)
                                        : [...values, opt]
                                      updateFilterCondition(condition.id, { value: newValues })
                                    }}
                                  >
                                    {opt}
                                  </Button>
                                )
                              })}
                            </div>
                          ) : fieldConfig?.type === 'date' ? (
                            <Input
                              type="date"
                              className="w-[160px]"
                              value={condition.value as string}
                              onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                            />
                          ) : fieldConfig?.type === 'number' || fieldConfig?.type === 'currency' ? (
                            <Input
                              type="number"
                              className="w-[120px]"
                              placeholder={fieldConfig?.type === 'currency' ? '£ Value' : 'Value'}
                              value={condition.value as string}
                              onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                            />
                          ) : (
                            <Input
                              className="w-[200px]"
                              placeholder="Value"
                              value={condition.value as string}
                              onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                            />
                          )}
                        </>
                      )}

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFilterCondition(condition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Add Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={addFilterCondition}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Column Settings */}
        {showColumnSettings && (
          <Card>
            <CardContent className="p-4">
              <span className="text-sm font-medium mb-3 block">Visible Columns</span>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <Button
                    key={col.key}
                    variant={col.visible ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleColumn(col.key)}
                  >
                    {col.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leads Table */}
      {Object.entries(groupedLeads).map(([groupName, groupLeads]) => (
        <Card key={groupName}>
          {groupBy !== 'none' && (
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{groupName}</span>
                <Badge variant="secondary">{groupLeads.length}</Badge>
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`text-left p-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground ${col.width || ''}`}
                        onClick={() => toggleSort(col.key as SortField)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortField === col.key && (
                            sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : groupLeads.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                        No finance leads found
                      </td>
                    </tr>
                  ) : (
                    groupLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/finance-leads/${lead.id}`)}
                      >
                        {visibleColumns.map((col) => (
                          <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                            {col.key === 'full_name' && (
                              <div className="flex items-center gap-2">
                                {(lead.quality_score || 0) >= 80 && (
                                  <Flame className="h-4 w-4 text-orange-500 shrink-0" />
                                )}
                                <span className="font-medium truncate">
                                  {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                                </span>
                              </div>
                            )}
                            {col.key === 'email' && (
                              <span className="truncate text-muted-foreground">{lead.email || '-'}</span>
                            )}
                            {col.key === 'phone' && (
                              <span className="truncate">{lead.phone || '-'}</span>
                            )}
                            {col.key === 'loan_amount' && (
                              <span className="font-medium">{lead.loan_amount ? formatCurrency(lead.loan_amount) : '-'}</span>
                            )}
                            {col.key === 'loan_type' && (
                              <Badge variant="secondary" className="text-[10px]">
                                {lead.loan_type || 'N/A'}
                              </Badge>
                            )}
                            {col.key === 'property_value' && (
                              <span>{lead.property_value ? formatCurrency(lead.property_value) : '-'}</span>
                            )}
                            {col.key === 'ltv' && (
                              <span className={`font-medium ${getLTVColor(lead.ltv)}`}>
                                {lead.ltv ? `${lead.ltv}%` : '-'}
                              </span>
                            )}
                            {col.key === 'credit_score' && (
                              <span className={`font-medium ${getCreditColor(lead.credit_score)}`}>
                                {lead.credit_score || '-'}
                              </span>
                            )}
                            {col.key === 'quality_score' && (
                              <span className={`font-medium ${getScoreColor(lead.quality_score)}`}>
                                {lead.quality_score || 0}
                              </span>
                            )}
                            {col.key === 'status' && (
                              <Badge variant={getStatusColor(lead.status) as any} className="text-[10px]">
                                {lead.status || 'New'}
                              </Badge>
                            )}
                            {col.key === 'source' && (
                              <span className="truncate">{lead.source || '-'}</span>
                            )}
                            {col.key === 'employment_status' && (
                              <span className="truncate">{lead.employment_status || '-'}</span>
                            )}
                            {col.key === 'income' && (
                              <span>{lead.income ? formatCurrency(lead.income) : '-'}</span>
                            )}
                            {col.key === 'campaign' && (
                              <span className="truncate text-muted-foreground">{lead.campaign || '-'}</span>
                            )}
                            {col.key === 'created_at' && (
                              <span className="text-muted-foreground">
                                {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); router.push(`/admin/finance-leads/${lead.id}`) }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length}
            </span>
            <select
              className="px-2 py-1 rounded-md border border-input bg-background text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
