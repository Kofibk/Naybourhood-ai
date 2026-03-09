'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useCompanies } from '@/hooks/useCompanies'
import { formatPriceShort } from '@/lib/utils'
import type { FinanceLead } from '@/types'
import {
  Search,
  Filter,
  Phone,
  Mail,
  Eye,
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
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react'

type SortField = 'full_name' | 'email' | 'phone' | 'finance_type' | 'loan_amount' | 'required_by_date' | 'message' | 'status' | 'notes' | 'assigned_agent' | 'date_added' | 'created_at'
type SortDirection = 'asc' | 'desc'
type GroupBy = 'none' | 'status' | 'finance_type' | 'assigned_agent'
type QuickFilter = 'all' | 'urgent' | 'awaiting_documents' | 'contact_pending' | 'completed'

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

type FilterFieldType = 'text' | 'select' | 'date' | 'currency'

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

// Define all filterable fields with their types - matching actual Supabase columns
const FILTER_FIELDS: FilterField[] = [
  { key: 'full_name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'finance_type', label: 'Finance Type', type: 'select', options: ['Bridging Finance', 'Development Finance', 'Residential', 'Buy to let', 'Other'] },
  { key: 'loan_amount', label: 'Loan Amount', type: 'currency' },
  { key: 'required_by_date', label: 'Required By', type: 'date' },
  { key: 'message', label: 'Message', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['Contact Pending', 'Follow-up', 'Awaiting Documents', 'Not Proceeding', 'Duplicate', 'Completed'] },
  { key: 'notes', label: 'Notes', type: 'text' },
  { key: 'assigned_agent', label: 'Assigned Agent', type: 'text' },
  { key: 'date_added', label: 'Date Added', type: 'date' },
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
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'full_name', label: 'Name', visible: true, width: 'min-w-[160px]' },
  { key: 'email', label: 'Email', visible: true, width: 'min-w-[200px]' },
  { key: 'phone', label: 'Phone', visible: true, width: 'min-w-[130px]' },
  { key: 'finance_type', label: 'Finance Type', visible: true, width: 'min-w-[160px]' },
  { key: 'loan_amount', label: 'Loan Amount', visible: true, width: 'min-w-[120px]' },
  { key: 'date_added', label: 'Date Added', visible: true, width: 'min-w-[110px]' },
  { key: 'company_id', label: 'Broker', visible: true, width: 'min-w-[160px]' },
  { key: 'assigned_agent', label: 'Assigned Agent', visible: true, width: 'min-w-[140px]' },
  { key: 'required_by_date', label: 'Required By', visible: false, width: 'min-w-[110px]' },
  { key: 'message', label: 'Message', visible: false, width: 'min-w-[220px]' },
  { key: 'status', label: 'Status', visible: true, width: 'min-w-[160px]' },
  { key: 'notes', label: 'Notes', visible: false, width: 'min-w-[180px]' },
  { key: 'created_at', label: 'Created', visible: false, width: 'min-w-[110px]' },
]

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

export default function FinanceLeadsPage() {
  const router = useRouter()
  const { companies } = useCompanies()
  const { financeLeads, isLoading, refreshFinanceLeads, updateFinanceLead } = useFinanceLeads()

  // Get broker companies only
  const brokerCompanies = useMemo(() => {
    return companies.filter(c => c.type === 'broker' || c.type === 'Broker')
  }, [companies])

  // Helper to get company name by ID
  const getCompanyName = (companyId?: string) => {
    if (!companyId) return '-'
    const company = companies.find(c => c.id === companyId)
    return company?.name || '-'
  }

  // Handle assigning broker to borrower
  const handleAssignBroker = async (leadId: string, companyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await updateFinanceLead(leadId, { company_id: companyId || undefined })
  }

  // Bulk assign all unassigned borrowers to a broker
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const handleBulkAssignBroker = async (companyId: string) => {
    if (!companyId) return
    setBulkAssigning(true)
    try {
      const unassignedLeads = financeLeads.filter(lead => !lead.company_id)
      for (const lead of unassignedLeads) {
        await updateFinanceLead(lead.id, { company_id: companyId })
      }
    } finally {
      setBulkAssigning(false)
    }
  }

  // Count unassigned leads
  const unassignedCount = useMemo(() =>
    financeLeads.filter(lead => !lead.company_id).length,
    [financeLeads]
  )

  // Quick filter tab state
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  // Urgency helper: returns 'overdue' | 'urgent' | 'normal' | null
  const getDateUrgency = useCallback((dateString?: string): 'overdue' | 'urgent' | 'normal' | null => {
    if (!dateString) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(dateString)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'overdue'
    if (diffDays <= 7) return 'urgent'
    return 'normal'
  }, [])

  // Pre-filter by quick filter tab (before Airtable filters)
  const quickFilteredLeads = useMemo(() => {
    if (quickFilter === 'all') return financeLeads
    return financeLeads.filter((lead) => {
      switch (quickFilter) {
        case 'urgent': {
          const urgency = getDateUrgency(lead.required_by_date)
          return urgency === 'overdue' || urgency === 'urgent'
        }
        case 'awaiting_documents':
          return lead.status === 'Awaiting Documents'
        case 'contact_pending':
          return lead.status === 'Contact Pending'
        case 'completed':
          return lead.status === 'Completed'
        default:
          return true
      }
    })
  }, [financeLeads, quickFilter, getDateUrgency])

  // Format loan amount with K/M suffix for summary
  const formatLoanSummary = useCallback((amount: number): string => {
    if (amount >= 1000000) {
      const m = amount / 1000000
      return m % 1 === 0 ? `\u00A3${m.toFixed(0)}M` : `\u00A3${m.toFixed(1)}M`
    }
    if (amount >= 1000) {
      const k = amount / 1000
      return k % 1 === 0 ? `\u00A3${k.toFixed(0)}K` : `\u00A3${k.toFixed(1)}K`
    }
    return `\u00A3${amount}`
  }, [])

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
        return value === conditionValue
      case 'not_equals':
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
        if (fieldConfig.type === 'currency') {
          return Number(rawValue) > Number(condition.value)
        }
        return false
      case 'less_than':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) < new Date(condition.value as string)
        }
        if (fieldConfig.type === 'currency') {
          return Number(rawValue) < Number(condition.value)
        }
        return false
      case 'greater_or_equal':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) >= new Date(condition.value as string)
        }
        if (fieldConfig.type === 'currency') {
          return Number(rawValue) >= Number(condition.value)
        }
        return false
      case 'less_or_equal':
        if (fieldConfig.type === 'date') {
          return new Date(rawValue) <= new Date(condition.value as string)
        }
        if (fieldConfig.type === 'currency') {
          return Number(rawValue) <= Number(condition.value)
        }
        return false
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

  // Filter leads based on all conditions (uses quickFilteredLeads as base)
  const filteredLeads = useMemo(() => {
    return quickFilteredLeads.filter((lead) => {
      // Text search
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          lead.full_name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.phone?.includes(search) ||
          lead.first_name?.toLowerCase().includes(searchLower) ||
          lead.last_name?.toLowerCase().includes(searchLower) ||
          lead.message?.toLowerCase().includes(searchLower)

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
  }, [quickFilteredLeads, search, filterConditions, filterLogic, matchesCondition])

  // Sort leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]

      // Handle date strings
      if (sortField === 'created_at' || sortField === 'required_by_date' || sortField === 'date_added') {
        aVal = aVal ? new Date(aVal).getTime() : 0
        bVal = bVal ? new Date(bVal).getTime() : 0
      }

      // Handle numeric fields
      if (sortField === 'loan_amount') {
        aVal = aVal || 0
        bVal = bVal || 0
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
  const filterKey = `${search}-${quickFilter}-${JSON.stringify(filterConditions)}-${filterLogic}`
  useEffect(() => {
    setCurrentPage(1)
  }, [filterKey])

  // Group leads
  const groupedLeads = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Borrowers': paginatedLeads }
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

  // Stats based on actual status values
  const stats = useMemo(() => {
    const totalLoanValue = filteredLeads.reduce((sum, l) => sum + (l.loan_amount || 0), 0)
    const urgentCount = financeLeads.filter((l) => {
      const u = getDateUrgency(l.required_by_date)
      return u === 'overdue' || u === 'urgent'
    }).length
    return {
      total: financeLeads.length,
      filtered: filteredLeads.length,
      contactPending: financeLeads.filter((l) => l.status === 'Contact Pending').length,
      followUp: financeLeads.filter((l) => l.status === 'Follow-up').length,
      awaitingDocs: financeLeads.filter((l) => l.status === 'Awaiting Documents').length,
      notProceeding: financeLeads.filter((l) => l.status === 'Not Proceeding' || l.status === 'Duplicate').length,
      completed: financeLeads.filter((l) => l.status === 'Completed').length,
      urgentCount,
      totalLoanValue,
    }
  }, [financeLeads, filteredLeads, getDateUrgency])

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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Contact Pending': return 'warning'
      case 'Follow-up': return 'default'
      case 'Awaiting Documents': return 'secondary'
      case 'Not Proceeding': return 'destructive'
      case 'Duplicate': return 'muted'
      case 'Completed': return 'success'
      default: return 'outline'
    }
  }

  const visibleColumns = columns.filter((c) => c.visible)
  const hasActiveFilters = filterConditions.length > 0 || search.length > 0

  // Quick filter presets
  const applyQuickFilter = (preset: string) => {
    switch (preset) {
      case 'contact_pending':
        setFilterConditions([{
          id: generateId(),
          field: 'status',
          operator: 'equals',
          value: 'Contact Pending',
        }])
        break
      case 'follow_up':
        setFilterConditions([{
          id: generateId(),
          field: 'status',
          operator: 'equals',
          value: 'Follow-up',
        }])
        break
      case 'awaiting_docs':
        setFilterConditions([{
          id: generateId(),
          field: 'status',
          operator: 'equals',
          value: 'Awaiting Documents',
        }])
        break
      default:
        setFilterConditions([])
    }
    setShowFilters(true)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Borrowers</h2>
          <div className="flex items-center gap-3">
            <p className="text-sm text-white/50">
              {stats.filtered === stats.total
                ? `${stats.total.toLocaleString()} total borrowers`
                : `Showing ${stats.filtered.toLocaleString()} of ${stats.total.toLocaleString()} borrowers`}
            </p>
            {stats.totalLoanValue > 0 && (
              <span className="text-sm font-semibold text-emerald-400">
                Total: {formatLoanSummary(stats.totalLoanValue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {unassignedCount > 0 && brokerCompanies.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">{unassignedCount} unassigned</span>
              <select
                className="h-8 text-xs rounded-md border border-white/10 bg-[#111111] text-white px-2"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAssignBroker(e.target.value)
                    e.target.value = ''
                  }
                }}
                disabled={bulkAssigning}
                defaultValue=""
              >
                <option value="">Bulk Assign to...</option>
                {brokerCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshFinanceLeads()}
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#111111] border border-white/10 rounded-xl cursor-pointer hover:border-primary/50" onClick={() => clearFilters()}>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Total</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.total.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('contact_pending')}>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-white/50">Contact Pending</span>
            </div>
            <p className="text-xl font-bold text-yellow-500">{stats.contactPending}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('follow_up')}>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-white/50">Follow-up</span>
            </div>
            <p className="text-xl font-bold text-blue-500">{stats.followUp}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl cursor-pointer hover:border-primary/50" onClick={() => applyQuickFilter('awaiting_docs')}>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-white/50">Awaiting Docs</span>
            </div>
            <p className="text-xl font-bold text-purple-500">{stats.awaitingDocs}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-destructive" />
              <span className="text-xs text-white/50">Not Proceeding</span>
            </div>
            <p className="text-xl font-bold text-destructive">{stats.notProceeding}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Filtered</span>
            </div>
            <p className="text-xl font-bold text-white">{stats.filtered.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by name, email, phone, or message..."
              className="pl-9 bg-[#111111] border-white/10 text-white placeholder:text-white/40"
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
              className="px-3 py-2 rounded-md border border-white/10 bg-[#111111] text-white text-sm"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="none">No Grouping</option>
              <option value="status">Group by Status</option>
              <option value="finance_type">Group by Finance Type</option>
              <option value="assigned_agent">Group by Agent</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {([
            { key: 'all' as QuickFilter, label: 'All', count: financeLeads.length, dotColor: '' },
            { key: 'urgent' as QuickFilter, label: 'Urgent', count: stats.urgentCount, dotColor: 'bg-red-500' },
            { key: 'awaiting_documents' as QuickFilter, label: 'Awaiting Documents', count: stats.awaitingDocs, dotColor: 'bg-amber-500' },
            { key: 'contact_pending' as QuickFilter, label: 'Contact Pending', count: stats.contactPending, dotColor: 'bg-blue-500' },
            { key: 'completed' as QuickFilter, label: 'Completed', count: stats.completed, dotColor: 'bg-emerald-500' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setQuickFilter(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                quickFilter === tab.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.dotColor && (
                <span className={`h-2 w-2 rounded-full ${tab.dotColor}`} />
              )}
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                quickFilter === tab.key ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Panel (Airtable-style) */}
        {showFilters && (
          <div className="bg-[#111111] border border-white/10 rounded-xl">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-white">Filter conditions</span>
                  {filterConditions.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">Match</span>
                      <select
                        className="px-2 py-1 rounded-md border border-white/10 bg-[#111111] text-white text-xs"
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
                        <span className="text-xs text-white/50 w-10">
                          {filterLogic === 'and' ? 'AND' : 'OR'}
                        </span>
                      )}
                      {index === 0 && <span className="w-10 text-xs text-white/50">Where</span>}

                      {/* Field Select */}
                      <select
                        className="px-2 py-1.5 rounded-md border border-white/10 bg-[#111111] text-white text-sm min-w-[140px]"
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
                        className="px-2 py-1.5 rounded-md border border-white/10 bg-[#111111] text-white text-sm min-w-[140px]"
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
                              className="px-2 py-1.5 rounded-md border border-white/10 bg-[#111111] text-white text-sm min-w-[140px]"
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
                              className="w-[160px] bg-[#111111] border-white/10 text-white"
                              value={condition.value as string}
                              onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                            />
                          ) : fieldConfig?.type === 'currency' ? (
                            <Input
                              type="number"
                              className="w-[150px] bg-[#111111] border-white/10 text-white placeholder:text-white/40"
                              placeholder="£ Amount"
                              value={condition.value as string}
                              onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                            />
                          ) : (
                            <Input
                              className="w-[200px] bg-[#111111] border-white/10 text-white placeholder:text-white/40"
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
                        className="h-8 w-8 text-white/50 hover:text-destructive"
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
            </div>
          </div>
        )}

        {/* Column Settings */}
        {showColumnSettings && (
          <div className="bg-[#111111] border border-white/10 rounded-xl">
            <div className="p-4">
              <span className="text-sm font-medium text-white mb-3 block">Visible Columns</span>
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
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      {Object.entries(groupedLeads).map(([groupName, groupLeads]) => (
        <div key={groupName} className="bg-[#111111] border border-white/10 rounded-xl">
          {groupBy !== 'none' && (
            <div className="py-3 px-4 border-b border-white/5">
              <h3 className="text-sm font-medium text-white flex items-center justify-between">
                <span>{groupName}</span>
                <Badge variant="secondary">{groupLeads.length}</Badge>
              </h3>
            </div>
          )}
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`text-left p-3 text-xs font-medium text-white/40 cursor-pointer hover:text-white ${col.width || ''}`}
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
                    <th className="text-right p-3 text-xs font-medium text-white/40 w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="text-center py-8 text-white/50">
                        Loading...
                      </td>
                    </tr>
                  ) : groupLeads.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="text-center py-8 text-white/50">
                        No borrowers found
                      </td>
                    </tr>
                  ) : (
                    groupLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/borrowers/${lead.id}`)}
                      >
                        {visibleColumns.map((col) => (
                          <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                            {col.key === 'full_name' && (
                              <span className="font-medium whitespace-nowrap">
                                {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                              </span>
                            )}
                            {col.key === 'email' && (
                              <span className="text-white/50 whitespace-nowrap">{lead.email || '-'}</span>
                            )}
                            {col.key === 'phone' && (
                              <span className="whitespace-nowrap">{lead.phone || '-'}</span>
                            )}
                            {col.key === 'finance_type' && (
                              <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                              >
                                {lead.finance_type || '-'}
                              </Badge>
                            )}
                            {col.key === 'loan_amount' && (
                              <span className="font-medium whitespace-nowrap">
                                {lead.loan_amount ? formatPriceShort(lead.loan_amount) : '-'}
                              </span>
                            )}
                            {col.key === 'date_added' && (
                              <span className="text-white/50 whitespace-nowrap">{formatDate(lead.date_added)}</span>
                            )}
                            {col.key === 'company_id' && (
                              <select
                                className="px-2.5 py-1.5 rounded-md border border-white/10 bg-[#111111] text-white text-xs font-medium min-w-[150px] cursor-pointer hover:border-primary/50"
                                value={lead.company_id || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleAssignBroker(lead.id, e.target.value, e as any)}
                              >
                                <option value="">Unassigned</option>
                                {brokerCompanies.length > 0 ? (
                                  brokerCompanies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                      {company.name}
                                    </option>
                                  ))
                                ) : (
                                  companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                      {company.name}
                                    </option>
                                  ))
                                )}
                              </select>
                            )}
                            {col.key === 'assigned_agent' && (
                              <span className="whitespace-nowrap">{lead.assigned_agent || '-'}</span>
                            )}
                            {col.key === 'required_by_date' && (
                              <span className="text-white/50 whitespace-nowrap flex items-center gap-1.5">
                                {(() => {
                                  const urgency = getDateUrgency(lead.required_by_date)
                                  if (urgency === 'overdue') return <span className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0" title="Overdue" />
                                  if (urgency === 'urgent') return <span className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Due within 7 days" />
                                  if (urgency === 'normal') return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="More than 7 days" />
                                  return null
                                })()}
                                {formatDate(lead.required_by_date)}
                              </span>
                            )}
                            {col.key === 'message' && (
                              <span className="text-white/50" title={lead.message}>
                                {truncateText(lead.message, 50)}
                              </span>
                            )}
                            {col.key === 'status' && (
                              <Badge
                                variant={getStatusColor(lead.status) as any}
                                className="text-xs font-medium"
                              >
                                <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${
                                  lead.status === 'Contact Pending' ? 'bg-amber-400' :
                                  lead.status === 'Follow-up' ? 'bg-blue-400' :
                                  lead.status === 'Awaiting Documents' ? 'bg-purple-400' :
                                  lead.status === 'Not Proceeding' ? 'bg-red-400' :
                                  lead.status === 'Duplicate' ? 'bg-gray-400' :
                                  lead.status === 'Completed' ? 'bg-emerald-400' :
                                  'bg-white/40'
                                }`} />
                                {lead.status || 'Unknown'}
                              </Badge>
                            )}
                            {col.key === 'notes' && (
                              <span className="text-white/50" title={lead.notes}>
                                {truncateText(lead.notes, 40)}
                              </span>
                            )}
                            {col.key === 'created_at' && (
                              <span className="text-white/50 whitespace-nowrap">
                                {formatDate(lead.created_at)}
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
                              onClick={(e) => { e.stopPropagation(); router.push(`/admin/borrowers/${lead.id}`) }}
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
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length}
            </span>
            <select
              className="px-2 py-1 rounded-md border border-white/10 bg-[#111111] text-white text-sm"
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
