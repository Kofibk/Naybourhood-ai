'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { AIOverview } from '@/components/ai/AIOverview'
import { EditableCell, EditableScore } from '@/components/ui/editable-cell'
import type { Buyer } from '@/types'
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
} from 'lucide-react'

type SortField = 'full_name' | 'quality_score' | 'intent_score' | 'budget' | 'status' | 'created_at' | 'source'
type SortDirection = 'asc' | 'desc'
type GroupBy = 'none' | 'status' | 'source' | 'campaign' | 'location' | 'timeline'

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Qualified',
  'Viewing Booked',
  'Offer Made',
  'Reserved',
  'Completed',
  'Lost',
]

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

type FilterFieldType = 'text' | 'number' | 'select' | 'date'

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
  editable?: boolean
  type?: 'text' | 'number' | 'select' | 'badge'
  options?: string[]
}

const FILTER_FIELDS: FilterField[] = [
  { key: 'full_name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'budget', label: 'Budget', type: 'text' },
  { key: 'quality_score', label: 'Quality Score', type: 'number' },
  { key: 'intent_score', label: 'Intent Score', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { key: 'source', label: 'Source', type: 'select', options: ['Facebook', 'Google', 'Instagram', 'Referral', 'Website', 'Other'] },
  { key: 'campaign', label: 'Campaign', type: 'text' },
  { key: 'timeline', label: 'Timeline', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
  { key: 'payment_method', label: 'Payment Method', type: 'text' },
  { key: 'created_at', label: 'Created Date', type: 'date' },
]

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
  { key: 'full_name', label: 'Name', visible: true, width: 'w-[200px]', editable: true, type: 'text' },
  { key: 'email', label: 'Email', visible: true, width: 'w-[200px]', editable: true, type: 'text' },
  { key: 'phone', label: 'Phone', visible: true, width: 'w-[140px]', editable: true, type: 'text' },
  { key: 'budget', label: 'Budget', visible: true, width: 'w-[120px]', editable: true, type: 'text' },
  { key: 'quality_score', label: 'Q Score', visible: true, width: 'w-[80px]', editable: true, type: 'number' },
  { key: 'intent_score', label: 'I Score', visible: true, width: 'w-[80px]', editable: true, type: 'number' },
  { key: 'status', label: 'Status', visible: true, width: 'w-[120px]', editable: true, type: 'select', options: STATUS_OPTIONS },
  { key: 'source', label: 'Source', visible: true, width: 'w-[120px]', editable: true, type: 'text' },
  { key: 'campaign', label: 'Campaign', visible: true, width: 'w-[150px]', editable: true, type: 'text' },
  { key: 'timeline', label: 'Timeline', visible: false, width: 'w-[120px]', editable: true, type: 'text' },
  { key: 'location', label: 'Location', visible: false, width: 'w-[150px]', editable: true, type: 'text' },
  { key: 'bedrooms', label: 'Beds', visible: false, width: 'w-[60px]', editable: true, type: 'number' },
  { key: 'payment_method', label: 'Payment', visible: false, width: 'w-[120px]', editable: true, type: 'text' },
  { key: 'created_at', label: 'Created', visible: false, width: 'w-[100px]', editable: false },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

export default function LeadsPage() {
  const router = useRouter()
  const { leads, isLoading, refreshData } = useData()

  const [search, setSearch] = useState('')
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>('and')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, any>>>({})

  const handleCellSave = useCallback(async (rowId: string, field: string, value: string | number): Promise<boolean> => {
    try {
      // Store as pending change and update local state
      setPendingChanges(prev => ({
        ...prev,
        [rowId]: { ...prev[rowId], [field]: value }
      }))

      // TODO: Send to API when available
      // await updateLead(rowId, { [field]: value })

      return true
    } catch (error) {
      console.error('Error saving cell:', error)
      return false
    }
  }, [])

  const addFilterCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: 'full_name',
      operator: 'contains',
      value: '',
    }
    setFilterConditions([...filterConditions, newCondition])
  }, [filterConditions])

  const updateFilterCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setFilterConditions(filterConditions.map((c) => {
      if (c.id !== id) return c
      if (updates.field && updates.field !== c.field) {
        const fieldConfig = FILTER_FIELDS.find((f) => f.key === updates.field)
        const operators = OPERATORS_BY_TYPE[fieldConfig?.type || 'text']
        return { ...c, ...updates, operator: operators[0].value, value: '' }
      }
      return { ...c, ...updates }
    }))
  }, [filterConditions])

  const removeFilterCondition = useCallback((id: string) => {
    setFilterConditions(filterConditions.filter((c) => c.id !== id))
  }, [filterConditions])

  const clearFilters = useCallback(() => {
    setFilterConditions([])
    setSearch('')
  }, [])

  const matchesCondition = useCallback((lead: Buyer, condition: FilterCondition): boolean => {
    const fieldConfig = FILTER_FIELDS.find((f) => f.key === condition.field)
    if (!fieldConfig) return true

    let rawValue: any = (lead as any)[condition.field]
    if (condition.field === 'full_name') {
      rawValue = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || ''
    }
    if (condition.field === 'location') {
      rawValue = lead.location || (lead as any).area || ''
    }

    const value = rawValue?.toString().toLowerCase() || ''
    const conditionValue = typeof condition.value === 'string' ? condition.value.toLowerCase() : ''

    switch (condition.operator) {
      case 'contains': return value.includes(conditionValue)
      case 'not_contains': return !value.includes(conditionValue)
      case 'equals':
        return fieldConfig.type === 'number' ? Number(rawValue) === Number(condition.value) : value === conditionValue
      case 'not_equals':
        return fieldConfig.type === 'number' ? Number(rawValue) !== Number(condition.value) : value !== conditionValue
      case 'starts_with': return value.startsWith(conditionValue)
      case 'ends_with': return value.endsWith(conditionValue)
      case 'is_empty': return !rawValue || rawValue === ''
      case 'is_not_empty': return rawValue && rawValue !== ''
      case 'greater_than':
        return fieldConfig.type === 'date' ? new Date(rawValue) > new Date(condition.value as string) : Number(rawValue) > Number(condition.value)
      case 'less_than':
        return fieldConfig.type === 'date' ? new Date(rawValue) < new Date(condition.value as string) : Number(rawValue) < Number(condition.value)
      case 'greater_or_equal':
        return fieldConfig.type === 'date' ? new Date(rawValue) >= new Date(condition.value as string) : Number(rawValue) >= Number(condition.value)
      case 'less_or_equal':
        return fieldConfig.type === 'date' ? new Date(rawValue) <= new Date(condition.value as string) : Number(rawValue) <= Number(condition.value)
      case 'is_any_of':
        const anyOfValues = Array.isArray(condition.value) ? condition.value : [condition.value]
        return anyOfValues.some((v) => v.toLowerCase() === value)
      case 'is_none_of':
        const noneOfValues = Array.isArray(condition.value) ? condition.value : [condition.value]
        return !noneOfValues.some((v) => v.toLowerCase() === value)
      default: return true
    }
  }, [])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
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
      if (filterConditions.length > 0) {
        if (filterLogic === 'and') {
          return filterConditions.every((condition) => matchesCondition(lead, condition))
        } else {
          return filterConditions.some((condition) => matchesCondition(lead, condition))
        }
      }
      return true
    })
  }, [leads, search, filterConditions, filterLogic, matchesCondition])

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]
      if (sortField === 'quality_score' || sortField === 'intent_score') { aVal = aVal || 0; bVal = bVal || 0 }
      if (sortField === 'created_at') { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0 }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLeads, sortField, sortDirection])

  const totalPages = Math.ceil(sortedLeads.length / pageSize)
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedLeads.slice(start, start + pageSize)
  }, [sortedLeads, currentPage, pageSize])

  const groupedLeads = useMemo(() => {
    if (groupBy === 'none') return { 'All Leads': paginatedLeads }
    const groups: Record<string, Buyer[]> = {}
    sortedLeads.forEach((lead) => {
      const groupValue = ((lead as any)[groupBy] as string) || 'Uncategorized'
      if (!groups[groupValue]) groups[groupValue] = []
      groups[groupValue].push(lead)
    })
    return groups
  }, [sortedLeads, groupBy, paginatedLeads])

  const stats = useMemo(() => ({
    total: leads.length,
    filtered: filteredLeads.length,
    hot: leads.filter((l) => (l.quality_score || 0) >= 80).length,
    new: leads.filter((l) => l.status === 'New').length,
    qualified: leads.filter((l) => l.status === 'Qualified').length,
  }), [leads, filteredLeads])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('desc') }
  }

  const toggleColumn = (key: string) => {
    setColumns(columns.map((col) => col.key === key ? { ...col, visible: !col.visible } : col))
  }

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'New': return 'warning'
      case 'Contacted': return 'secondary'
      case 'Qualified': return 'success'
      case 'Viewing Booked': return 'default'
      case 'Reserved': case 'Completed': return 'success'
      case 'Lost': return 'destructive'
      default: return 'muted'
    }
  }

  const visibleColumns = columns.filter((c) => c.visible)
  const hasActiveFilters = filterConditions.length > 0 || search.length > 0

  const applyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'hot': setFilterConditions([{ id: generateId(), field: 'quality_score', operator: 'greater_or_equal', value: '80' }]); break
      case 'new': setFilterConditions([{ id: generateId(), field: 'status', operator: 'equals', value: 'New' }]); break
      case 'qualified': setFilterConditions([{ id: generateId(), field: 'status', operator: 'equals', value: 'Qualified' }]); break
      default: setFilterConditions([])
    }
    setShowFilters(true)
  }

  const getCellValue = (lead: Buyer, field: string) => {
    const pending = pendingChanges[lead.id]
    if (pending && field in pending) return pending[field]
    if (field === 'full_name') return lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
    if (field === 'location') return lead.location || (lead as any).area || ''
    return (lead as any)[field]
  }

  return (
    <div className="space-y-6">
      {/* AI Overview */}
      <AIOverview pageType="leads" onAction={(insight) => { if (insight.leadId) router.push(`/admin/leads/${insight.leadId}`) }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {stats.filtered === stats.total ? `${stats.total.toLocaleString()} total leads` : `Showing ${stats.filtered.toLocaleString()} of ${stats.total.toLocaleString()} leads`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => clearFilters()}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Total</span></div>
            <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('hot')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /><span className="text-xs text-muted-foreground">Hot</span></div>
            <p className="text-xl font-bold text-orange-500">{stats.hot}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('new')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">New</span></div>
            <p className="text-xl font-bold text-blue-500">{stats.new}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('qualified')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><Users className="h-4 w-4 text-success" /><span className="text-xs text-muted-foreground">Qualified</span></div>
            <p className="text-xl font-bold text-success">{stats.qualified}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Filtered</span></div>
            <p className="text-xl font-bold">{stats.filtered.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant={showFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />Filters
              {filterConditions.length > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{filterConditions.length}</Badge>}
            </Button>
            <Button variant="outline" onClick={() => setShowColumnSettings(!showColumnSettings)}><ArrowUpDown className="h-4 w-4 mr-2" />Columns</Button>
            <select className="px-3 py-2 rounded-md border border-input bg-background text-sm" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
              <option value="none">No Grouping</option>
              <option value="status">Group by Status</option>
              <option value="source">Group by Source</option>
              <option value="campaign">Group by Campaign</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Filter conditions</span>
                  {filterConditions.length > 1 && (
                    <select className="px-2 py-1 rounded-md border border-input bg-background text-xs" value={filterLogic} onChange={(e) => setFilterLogic(e.target.value as 'and' | 'or')}>
                      <option value="and">ALL conditions (AND)</option>
                      <option value="or">ANY condition (OR)</option>
                    </select>
                  )}
                </div>
                {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="h-4 w-4 mr-1" />Clear All</Button>}
              </div>
              <div className="space-y-2">
                {filterConditions.map((condition, index) => {
                  const fieldConfig = FILTER_FIELDS.find((f) => f.key === condition.field)
                  const operators = OPERATORS_BY_TYPE[fieldConfig?.type || 'text']
                  const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator)
                  return (
                    <div key={condition.id} className="flex items-center gap-2 flex-wrap">
                      <span className="w-10 text-xs text-muted-foreground">{index === 0 ? 'Where' : filterLogic === 'and' ? 'AND' : 'OR'}</span>
                      <select className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]" value={condition.field} onChange={(e) => updateFilterCondition(condition.id, { field: e.target.value })}>
                        {FILTER_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                      </select>
                      <select className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]" value={condition.operator} onChange={(e) => updateFilterCondition(condition.id, { operator: e.target.value as FilterOperator })}>
                        {operators.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                      </select>
                      {needsValue && (
                        fieldConfig?.type === 'select' ? (
                          <select className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]" value={condition.value as string} onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}>
                            <option value="">Select...</option>
                            {fieldConfig.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : fieldConfig?.type === 'number' ? (
                          <Input type="number" className="w-[100px]" placeholder="Value" value={condition.value as string} onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })} />
                        ) : (
                          <Input className="w-[200px]" placeholder="Value" value={condition.value as string} onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })} />
                        )
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeFilterCondition(condition.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )
                })}
              </div>
              <Button variant="outline" size="sm" onClick={addFilterCondition} className="mt-2"><Plus className="h-4 w-4 mr-2" />Add Filter</Button>
            </CardContent>
          </Card>
        )}

        {showColumnSettings && (
          <Card>
            <CardContent className="p-4">
              <span className="text-sm font-medium mb-3 block">Visible Columns</span>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => <Button key={col.key} variant={col.visible ? 'default' : 'outline'} size="sm" onClick={() => toggleColumn(col.key)}>{col.label}</Button>)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted-foreground">💡 Double-click any cell to edit inline</p>

      {/* Leads Table */}
      {Object.entries(groupedLeads).map(([groupName, groupLeads]) => (
        <Card key={groupName}>
          {groupBy !== 'none' && (
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm flex items-center justify-between"><span>{groupName}</span><Badge variant="secondary">{groupLeads.length}</Badge></CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {visibleColumns.map((col) => (
                      <th key={col.key} className={`text-left p-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground ${col.width || ''}`} onClick={() => toggleSort(col.key as SortField)}>
                        <div className="flex items-center gap-1">
                          {col.label}
                          {sortField === col.key && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                    ))}
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                  ) : groupLeads.length === 0 ? (
                    <tr><td colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">No leads found</td></tr>
                  ) : (
                    groupLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        {visibleColumns.map((col) => {
                          const cellValue = getCellValue(lead, col.key)
                          if (col.key === 'full_name') {
                            return (
                              <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                                <div className="flex items-center gap-2">
                                  {(lead.quality_score || 0) >= 80 && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                                  <EditableCell value={cellValue} field={col.key} rowId={lead.id} onSave={handleCellSave} className="font-medium" editable={col.editable} />
                                </div>
                              </td>
                            )
                          }
                          if (col.key === 'quality_score' || col.key === 'intent_score') {
                            return <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}><EditableScore value={cellValue} field={col.key} rowId={lead.id} onSave={handleCellSave} /></td>
                          }
                          if (col.key === 'status') {
                            return (
                              <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                                <EditableCell value={cellValue} field={col.key} rowId={lead.id} type="select" options={STATUS_OPTIONS} onSave={handleCellSave} editable={col.editable} />
                              </td>
                            )
                          }
                          if (col.key === 'created_at') {
                            return <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}><span className="text-muted-foreground">{cellValue ? new Date(cellValue).toLocaleDateString() : '-'}</span></td>
                          }
                          return <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}><EditableCell value={cellValue} field={col.key} rowId={lead.id} type={col.type || 'text'} options={col.options} onSave={handleCellSave} editable={col.editable} /></td>
                        })}
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Mail className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push(`/admin/leads/${lead.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
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
            <span>Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length}</span>
            <select className="px-2 py-1 rounded-md border border-input bg-background text-sm" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>First</Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-3 text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
          </div>
        </div>
      )}
    </div>
  )
}
