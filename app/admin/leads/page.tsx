'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
  Plus,
  Trash2,
  Thermometer,
} from 'lucide-react'

type SortField = 'full_name' | 'quality_score' | 'ai_confidence' | 'budget' | 'status' | 'created_at' | 'assigned_user_name' | 'source' | 'campaign'
type SortDirection = 'asc' | 'desc'
type QuickFilter = 'all' | 'hot' | 'warm' | 'low'

// Updated status options to match specification
const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Duplicate',
]

const PAYMENT_OPTIONS = ['Cash', 'Mortgage']

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
  { key: 'phone', label: 'Mobile', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'budget', label: 'Budget', type: 'text' },
  { key: 'quality_score', label: 'Lead Score', type: 'number' },
  { key: 'ai_confidence', label: 'Confidence', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { key: 'payment_method', label: 'Payment', type: 'select', options: PAYMENT_OPTIONS },
  { key: 'assigned_user_name', label: 'Assigned', type: 'text' },
  { key: 'source', label: 'Source', type: 'text' },
  { key: 'campaign', label: 'Campaign', type: 'text' },
  { key: 'created_at', label: 'Date Added', type: 'date' },
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

// Updated columns to match Buyer type fields
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'full_name', label: 'Full Name', visible: true, width: 'w-[180px]', editable: true, type: 'text' },
  { key: 'phone', label: 'Mobile', visible: true, width: 'w-[140px]', editable: true, type: 'text' },
  { key: 'email', label: 'Email', visible: true, width: 'w-[200px]', editable: true, type: 'text' },
  { key: 'budget', label: 'Budget', visible: true, width: 'w-[130px]', editable: true, type: 'text' },
  { key: 'quality_score', label: 'Score', visible: true, width: 'w-[80px]', editable: true, type: 'number' },
  { key: 'ai_confidence', label: 'Conf', visible: true, width: 'w-[90px]', editable: false },
  { key: 'status', label: 'Status', visible: true, width: 'w-[120px]', editable: true, type: 'select', options: STATUS_OPTIONS },
  { key: 'payment_method', label: 'Payment', visible: true, width: 'w-[90px]', editable: true, type: 'select', options: PAYMENT_OPTIONS },
  { key: 'created_at', label: 'Added', visible: true, width: 'w-[100px]', editable: false },
  { key: 'assigned_user_name', label: 'Assigned', visible: true, width: 'w-[120px]', editable: true, type: 'text' },
  { key: 'source', label: 'Source', visible: false, width: 'w-[100px]', editable: true, type: 'text' },
  { key: 'campaign', label: 'Campaign', visible: false, width: 'w-[150px]', editable: true, type: 'text' },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

// Score Badge Component - matches specification colors
function ScoreBadge({ score }: { score: number | undefined | null }) {
  if (score === undefined || score === null) {
    return <span className="text-muted-foreground">-</span>
  }

  const getColor = (s: number) => {
    if (s >= 70) return 'bg-red-500 text-white'      // Hot
    if (s >= 45) return 'bg-orange-500 text-white'   // Warm
    return 'bg-gray-400 text-white'                   // Low
  }

  return (
    <span className={`px-2 py-0.5 rounded text-sm font-medium ${getColor(score)}`}>
      {score}
    </span>
  )
}

// Status Badge Component - matches specification colors
function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>

  const styles: Record<string, string> = {
    'Contact Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Follow Up': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Viewing Booked': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Negotiating': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'Reserved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Exchanged': 'bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300',
    'Completed': 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Not Proceeding': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'Duplicate': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${styles[status] || 'bg-gray-100 dark:bg-gray-800'}`}>
      {status}
    </span>
  )
}

// Payment Badge Component
function PaymentBadge({ method }: { method: string | undefined | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>

  const styles: Record<string, string> = {
    'Cash': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Mortgage': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[method] || 'bg-gray-100'}`}>
      {method === 'Mortgage' ? 'Mort' : method}
    </span>
  )
}

export default function LeadsPage() {
  const router = useRouter()
  const { leads, users, isLoading, refreshData, updateLead } = useData()

  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>([])
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>('and')
  const [sortField, setSortField] = useState<SortField>('quality_score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, any>>>({})
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  const handleCellSave = useCallback(async (rowId: string, field: string, value: string | number): Promise<boolean> => {
    try {
      // Update locally first for immediate feedback
      setPendingChanges(prev => ({
        ...prev,
        [rowId]: { ...prev[rowId], [field]: value }
      }))
      // Actually save to database
      if (updateLead) {
        await updateLead(rowId, { [field]: value })
      }
      return true
    } catch (error) {
      console.error('Error saving cell:', error)
      return false
    }
  }, [updateLead])

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
    setQuickFilter('all')
  }, [])

  const matchesCondition = useCallback((lead: Buyer, condition: FilterCondition): boolean => {
    const fieldConfig = FILTER_FIELDS.find((f) => f.key === condition.field)
    if (!fieldConfig) return true

    let rawValue: any = (lead as any)[condition.field]
    if (condition.field === 'full_name') {
      rawValue = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || ''
    }
    if (condition.field === 'assigned_user_name') {
      rawValue = lead.assigned_user_name || lead.assigned_user || lead.assigned_to || ''
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

  // Calculate lead classification counts
  const leadCounts = useMemo(() => {
    const hot = leads.filter((l) => (l.quality_score || 0) >= 70).length
    const warm = leads.filter((l) => (l.quality_score || 0) >= 45 && (l.quality_score || 0) < 70).length
    const low = leads.filter((l) => (l.quality_score || 0) < 45).length
    return { hot, warm, low, total: leads.length }
  }, [leads])

  // Get unique values for dynamic filters
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>()
    leads.forEach((lead) => {
      const name = lead.assigned_user_name || lead.assigned_user || lead.assigned_to
      if (name) assignees.add(name)
    })
    return Array.from(assignees).sort()
  }, [leads])

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>()
    leads.forEach((lead) => {
      if (lead.status) statuses.add(lead.status)
    })
    return Array.from(statuses).sort()
  }, [leads])

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>()
    leads.forEach((lead) => {
      if (lead.source) sources.add(lead.source)
    })
    return Array.from(sources).sort()
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Apply quick filter first
      if (quickFilter !== 'all') {
        const score = lead.quality_score || 0
        if (quickFilter === 'hot' && score < 70) return false
        if (quickFilter === 'warm' && (score < 45 || score >= 70)) return false
        if (quickFilter === 'low' && score >= 45) return false
      }

      // Apply search
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

      // Apply filter conditions
      if (filterConditions.length > 0) {
        if (filterLogic === 'and') {
          return filterConditions.every((condition) => matchesCondition(lead, condition))
        } else {
          return filterConditions.some((condition) => matchesCondition(lead, condition))
        }
      }
      return true
    })
  }, [leads, search, quickFilter, filterConditions, filterLogic, matchesCondition])

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]
      if (sortField === 'quality_score' || sortField === 'ai_confidence') { aVal = aVal || 0; bVal = bVal || 0 }
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

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('desc') }
  }

  const toggleColumn = (key: string) => {
    setColumns(columns.map((col) => col.key === key ? { ...col, visible: !col.visible } : col))
  }

  const toggleSelectAll = () => {
    if (selectedLeads.size === paginatedLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(paginatedLeads.map(l => l.id)))
    }
  }

  const toggleSelectLead = (id: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedLeads(newSelected)
  }

  const visibleColumns = columns.filter((c) => c.visible)
  const hasActiveFilters = filterConditions.length > 0 || search.length > 0 || quickFilter !== 'all'

  const getCellValue = (lead: Buyer, field: string) => {
    const pending = pendingChanges[lead.id]
    if (pending && field in pending) return pending[field]
    if (field === 'full_name') return lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
    // Handle budget - show budget string or format budget_min/budget_max
    if (field === 'budget') {
      if (lead.budget) return lead.budget
      if (lead.budget_min && lead.budget_max) {
        return `£${(lead.budget_min / 1000000).toFixed(1)}M - £${(lead.budget_max / 1000000).toFixed(1)}M`
      }
      if (lead.budget_min) return `£${lead.budget_min.toLocaleString()}+`
      if (lead.budget_max) return `Up to £${lead.budget_max.toLocaleString()}`
      return ''
    }
    // Handle confidence - try ai_confidence first
    if (field === 'ai_confidence') {
      return lead.ai_confidence ?? null
    }
    // Handle assigned user - try multiple fields
    if (field === 'assigned_user_name') {
      return lead.assigned_user_name || lead.assigned_user || lead.assigned_to || ''
    }
    return (lead as any)[field]
  }

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
            {filteredLeads.length === leads.length
              ? `${leads.length.toLocaleString()} total leads`
              : `Showing ${filteredLeads.length.toLocaleString()} of ${leads.length.toLocaleString()} leads`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={quickFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setQuickFilter('all'); setCurrentPage(1) }}
        >
          All
        </Button>
        <Button
          variant={quickFilter === 'hot' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setQuickFilter('hot'); setCurrentPage(1) }}
          className={quickFilter === 'hot' ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          <Flame className="h-4 w-4 mr-1" />
          Hot {leadCounts.hot}
        </Button>
        <Button
          variant={quickFilter === 'warm' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setQuickFilter('warm'); setCurrentPage(1) }}
          className={quickFilter === 'warm' ? 'bg-orange-500 hover:bg-orange-600' : ''}
        >
          <Thermometer className="h-4 w-4 mr-1" />
          Warm {leadCounts.warm}
        </Button>
        <Button
          variant={quickFilter === 'low' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setQuickFilter('low'); setCurrentPage(1) }}
        >
          Low {leadCounts.low}
        </Button>

        {/* Dropdown Filters */}
        <div className="flex gap-2 ml-auto flex-wrap">
          <select
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
            onChange={(e) => {
              if (e.target.value) {
                setFilterConditions(prev => [...prev.filter(c => c.field !== 'status'), { id: generateId(), field: 'status', operator: 'equals', value: e.target.value }])
              } else {
                setFilterConditions(filterConditions.filter(c => c.field !== 'status'))
              }
            }}
          >
            <option value="">Status ▾</option>
            {/* Show actual statuses from data first, then fallback options */}
            {uniqueStatuses.length > 0
              ? uniqueStatuses.map(opt => <option key={opt} value={opt}>{opt}</option>)
              : STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)
            }
          </select>
          <select
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
            onChange={(e) => {
              if (e.target.value) {
                setFilterConditions(prev => [...prev.filter(c => c.field !== 'payment_method'), { id: generateId(), field: 'payment_method', operator: 'equals', value: e.target.value }])
              } else {
                setFilterConditions(filterConditions.filter(c => c.field !== 'payment_method'))
              }
            }}
          >
            <option value="">Payment ▾</option>
            {PAYMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
            onChange={(e) => {
              if (e.target.value) {
                setFilterConditions(prev => [...prev.filter(c => c.field !== 'assigned_user_name'), { id: generateId(), field: 'assigned_user_name', operator: 'equals', value: e.target.value }])
              } else {
                setFilterConditions(filterConditions.filter(c => c.field !== 'assigned_user_name'))
              }
            }}
          >
            <option value="">Assigned ▾</option>
            {uniqueAssignees.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {filterConditions.length > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{filterConditions.length}</Badge>}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowColumnSettings(!showColumnSettings)}>
          <ArrowUpDown className="h-4 w-4 mr-2" />Columns
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filter conditions</span>
                {filterConditions.length > 1 && (
                  <select
                    className="px-2 py-1 rounded-md border border-input bg-background text-xs"
                    value={filterLogic}
                    onChange={(e) => setFilterLogic(e.target.value as 'and' | 'or')}
                  >
                    <option value="and">ALL conditions (AND)</option>
                    <option value="or">ANY condition (OR)</option>
                  </select>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {filterConditions.map((condition, index) => {
                const fieldConfig = FILTER_FIELDS.find((f) => f.key === condition.field)
                const operators = OPERATORS_BY_TYPE[fieldConfig?.type || 'text']
                const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator)
                return (
                  <div key={condition.id} className="flex items-center gap-2 flex-wrap">
                    <span className="w-10 text-xs text-muted-foreground">{index === 0 ? 'Where' : filterLogic === 'and' ? 'AND' : 'OR'}</span>
                    <select
                      className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                      value={condition.field}
                      onChange={(e) => updateFilterCondition(condition.id, { field: e.target.value })}
                    >
                      {FILTER_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                    </select>
                    <select
                      className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                      value={condition.operator}
                      onChange={(e) => updateFilterCondition(condition.id, { operator: e.target.value as FilterOperator })}
                    >
                      {operators.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                    {needsValue && (
                      fieldConfig?.type === 'select' ? (
                        <select
                          className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                          value={condition.value as string}
                          onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                        >
                          <option value="">Select...</option>
                          {fieldConfig.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : fieldConfig?.type === 'number' ? (
                        <Input
                          type="number"
                          className="w-[100px]"
                          placeholder="Value"
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
                      )
                    )}
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
            <Button variant="outline" size="sm" onClick={addFilterCondition} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />Add Filter
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

      <p className="text-xs text-muted-foreground">💡 Double-click any cell to edit inline</p>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-[40px] p-3">
                    <Checkbox
                      checked={selectedLeads.size === paginatedLeads.length && paginatedLeads.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left p-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground ${col.width || ''}`}
                      onClick={() => toggleSort(col.key as SortField)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.key && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </th>
                  ))}
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={visibleColumns.length + 2} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : paginatedLeads.length === 0 ? (
                  <tr><td colSpan={visibleColumns.length + 2} className="text-center py-8 text-muted-foreground">No leads found</td></tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/leads/${lead.id}`)}
                    >
                      <td className="p-3 w-[40px]" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => toggleSelectLead(lead.id)}
                        />
                      </td>
                      {visibleColumns.map((col) => {
                        const cellValue = getCellValue(lead, col.key)

                        if (col.key === 'full_name') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              <div className="flex items-center gap-2">
                                <EditableCell
                                  value={cellValue}
                                  field={col.key}
                                  rowId={lead.id}
                                  onSave={handleCellSave}
                                  className="font-medium"
                                  editable={col.editable}
                                />
                              </div>
                            </td>
                          )
                        }

                        if (col.key === 'quality_score') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              <ScoreBadge score={cellValue} />
                            </td>
                          )
                        }

                        if (col.key === 'ai_confidence') {
                          const conf = cellValue as number | undefined
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              <span className="text-muted-foreground">
                                {conf ? `${Math.round(conf * 100)}%` : '-'}
                              </span>
                            </td>
                          )
                        }

                        if (col.key === 'status') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`} onClick={(e) => e.stopPropagation()}>
                              <select
                                value={cellValue || ''}
                                onChange={(e) => handleCellSave(lead.id, 'status', e.target.value)}
                                className="px-2 py-1 rounded-md border border-input bg-background text-xs font-medium cursor-pointer hover:border-primary"
                              >
                                <option value="">Select...</option>
                                {(uniqueStatuses.length > 0 ? uniqueStatuses : STATUS_OPTIONS).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          )
                        }

                        if (col.key === 'payment_method') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`} onClick={(e) => e.stopPropagation()}>
                              <select
                                value={cellValue || ''}
                                onChange={(e) => handleCellSave(lead.id, 'payment_method', e.target.value)}
                                className="px-2 py-1 rounded-md border border-input bg-background text-xs font-medium cursor-pointer hover:border-primary"
                              >
                                <option value="">Select...</option>
                                {PAYMENT_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          )
                        }

                        if (col.key === 'assigned_user_name') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`} onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.assigned_to || ''}
                                onChange={(e) => handleCellSave(lead.id, 'assigned_to', e.target.value)}
                                className="px-2 py-1 rounded-md border border-input bg-background text-xs font-medium cursor-pointer hover:border-primary max-w-[120px]"
                              >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                  <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                              </select>
                            </td>
                          )
                        }

                        if (col.key === 'created_at') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              <span className="text-muted-foreground">{formatDate(cellValue)}</span>
                            </td>
                          )
                        }

                        if (col.key === 'phone' || col.key === 'email') {
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              <span className={col.key === 'email' ? 'text-muted-foreground truncate block max-w-[200px]' : ''}>
                                {cellValue || '-'}
                              </span>
                            </td>
                          )
                        }

                        return (
                          <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                            <EditableCell
                              value={cellValue}
                              field={col.key}
                              rowId={lead.id}
                              type={col.type || 'text'}
                              options={col.options}
                              onSave={handleCellSave}
                              editable={col.editable}
                            />
                          </td>
                        )
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

      {/* Pagination */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length.toLocaleString()}</span>
          <select
            className="px-2 py-1 rounded-md border border-input bg-background text-sm"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />Prev
          </Button>
          <span className="px-3 text-sm">Page {currentPage} of {totalPages || 1}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
            Next<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
