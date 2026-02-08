'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useData } from '@/contexts/DataContext'
import { useLeads } from '@/hooks/useLeads'
import { AIOverview } from '@/components/ai/AIOverview'
import { EditableCell, EditableScore } from '@/components/ui/editable-cell'
import { useAutoScore } from '@/hooks/useAutoScore'
import { calculateHeuristicScore } from '@/lib/utils'
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
  Upload,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  Trash2,
  Thermometer,
  Zap,
  Bot,
} from 'lucide-react'
import { CSVImport } from '@/components/CSVImport'

type SortField = 'full_name' | 'quality_score' | 'lead_score' | 'ai_confidence' | 'budget' | 'status' | 'created_at' | 'assigned_user_name' | 'source' | 'campaign'
type SortDirection = 'asc' | 'desc'
type QuickFilter = 'all' | 'hot' | 'warm' | 'low'

// Status categories with colors matching Supabase
// Green = Positive outcomes
// Amber = In progress/pending
// Red = Negative outcomes
// Grey = Duplicates (excluded from stats)
const STATUS_CONFIG = {
  // Green - Positive statuses
  'Reserved': { color: 'green', category: 'positive' },
  'Exchanged': { color: 'green', category: 'positive' },
  'Completed': { color: 'green', category: 'positive' },
  // Amber - Middle/Pending statuses
  'Contact Pending': { color: 'amber', category: 'pending' },
  'Follow Up': { color: 'amber', category: 'pending' },
  'Viewing Booked': { color: 'amber', category: 'pending' },
  'Negotiating': { color: 'amber', category: 'pending' },
  // Red - Negative statuses
  'Not Proceeding': { color: 'red', category: 'negative' },
  // Grey - Disqualified (excluded from stats) - includes duplicates, fakes, unverifiable
  'Disqualified': { color: 'grey', category: 'disqualified' },
} as const

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG)

const PAYMENT_OPTIONS = ['Cash', 'Mortgage']

const CLASS_OPTIONS = ['Hot', 'Hot Lead', 'Qualified', 'Needs Qualification', 'Warm-Qualified', 'Warm-Engaged', 'Nurture', 'Low Priority', 'Cold', 'Disqualified']

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
  { key: 'ai_classification', label: 'Class', type: 'select', options: CLASS_OPTIONS },
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
  { key: 'full_name', label: 'Full Name', visible: true, width: 'min-w-[180px]', editable: true, type: 'text' },
  { key: 'phone', label: 'Mobile', visible: true, width: 'min-w-[140px]', editable: true, type: 'text' },
  { key: 'email', label: 'Email', visible: true, width: 'min-w-[220px]', editable: true, type: 'text' },
  { key: 'budget', label: 'Budget', visible: true, width: 'min-w-[130px]', editable: true, type: 'text' },
  { key: 'lead_score', label: 'Lead Score', visible: true, width: 'min-w-[100px]', editable: false, type: 'number' },
  { key: 'ai_classification', label: 'Classification', visible: true, width: 'min-w-[130px]', editable: false },
  { key: 'status', label: 'Status', visible: true, width: 'min-w-[160px]', editable: true, type: 'select', options: STATUS_OPTIONS },
  { key: 'payment_method', label: 'Payment', visible: true, width: 'min-w-[110px]', editable: true, type: 'select', options: PAYMENT_OPTIONS },
  { key: 'created_at', label: 'Date Added', visible: true, width: 'min-w-[110px]', editable: false },
  { key: 'assigned_user_name', label: 'Assigned', visible: true, width: 'min-w-[140px]', editable: true, type: 'text' },
  { key: 'source', label: 'Source', visible: false, width: 'min-w-[120px]', editable: true, type: 'text' },
  { key: 'campaign', label: 'Campaign', visible: false, width: 'min-w-[160px]', editable: true, type: 'text' },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

// LocalStorage key for persisting preferences
const LEADS_PREFERENCES_KEY = 'naybourhood_leads_preferences'

interface LeadsPreferences {
  sortField: SortField
  sortDirection: SortDirection
  quickFilter: QuickFilter
  filterConditions: FilterCondition[]
  filterLogic: 'and' | 'or'
  columns: ColumnConfig[]
  pageSize: number
}

const DEFAULT_PREFERENCES: LeadsPreferences = {
  sortField: 'created_at',  // Default: newest first
  sortDirection: 'desc',
  quickFilter: 'all',
  filterConditions: [],
  filterLogic: 'and',
  columns: DEFAULT_COLUMNS,
  pageSize: 50,
}

function loadPreferences(): LeadsPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const stored = localStorage.getItem(LEADS_PREFERENCES_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle any new fields
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        // Ensure columns have all required fields by merging with defaults
        columns: DEFAULT_COLUMNS.map(defaultCol => {
          const storedCol = parsed.columns?.find((c: ColumnConfig) => c.key === defaultCol.key)
          return storedCol ? { ...defaultCol, visible: storedCol.visible } : defaultCol
        }),
      }
    }
  } catch (e) {
    console.error('Failed to load leads preferences:', e)
  }
  return DEFAULT_PREFERENCES
}

function savePreferences(prefs: Partial<LeadsPreferences>) {
  if (typeof window === 'undefined') return
  try {
    const current = loadPreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem(LEADS_PREFERENCES_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save leads preferences:', e)
  }
}

// Format budget string to use proper M/K notation
// Converts "£12000K" to "£12M", "£1500K" to "£1.5M", etc.
function formatBudgetDisplay(budget: string | null | undefined): string {
  if (!budget) return ''

  // If it contains a range indicator, process both parts
  if (budget.includes(' - ') || budget.includes(' to ')) {
    const parts = budget.split(/\s*[-–to]+\s*/)
    if (parts.length === 2) {
      return `${formatBudgetPart(parts[0])} - ${formatBudgetPart(parts[1])}`
    }
  }

  return formatBudgetPart(budget)
}

function formatBudgetPart(part: string): string {
  if (!part) return ''

  // Check for values like "£12000K" or "12000K" which should be "£12M"
  const kMatch = part.match(/[£]?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*[Kk]/)
  if (kMatch) {
    const numStr = kMatch[1].replace(/,/g, '')
    const num = parseFloat(numStr)
    if (!isNaN(num)) {
      if (num >= 1000) {
        // Convert to millions (e.g., 12000K = 12M)
        const millions = num / 1000
        if (millions % 1 === 0) {
          return `£${millions.toFixed(0)}M`
        }
        return `£${millions.toFixed(1)}M`
      }
      // Keep as K but format nicely
      return `£${num.toFixed(0)}K`
    }
  }

  // Check for plain numbers that might need formatting
  const plainMatch = part.match(/[£]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(Million|million|M|m)?/)
  if (plainMatch) {
    const numStr = plainMatch[1].replace(/,/g, '')
    const num = parseFloat(numStr)
    const suffix = plainMatch[2]

    if (!isNaN(num)) {
      if (suffix && suffix.toLowerCase().startsWith('m')) {
        return `£${num % 1 === 0 ? num.toFixed(0) : num.toFixed(1)}M`
      }
      // Large numbers without suffix - assume they're in pounds
      if (num >= 1000000) {
        const millions = num / 1000000
        return `£${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
      }
      if (num >= 1000) {
        const thousands = num / 1000
        return `£${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`
      }
    }
  }

  // Return original if no pattern matched
  return part
}

// Score Indicator Component - Traffic light color system with score number
// Green = Hot (70+), Amber = Warm (45-69), Red = Cold (<45)
function ScoreIndicator({ score }: { score: number | undefined | null }) {
  if (score === undefined || score === null) {
    return <span className="text-muted-foreground">-</span>
  }

  const getConfig = (s: number) => {
    if (s >= 70) return { color: 'bg-green-500', textColor: 'text-green-600', label: 'Hot' }
    if (s >= 45) return { color: 'bg-amber-500', textColor: 'text-amber-600', label: 'Warm' }
    return { color: 'bg-red-500', textColor: 'text-red-600', label: 'Cold' }
  }

  const config = getConfig(score)

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className={`w-3 h-3 rounded-full ${config.color}`} title={config.label} />
      <span className={`text-sm font-medium ${config.textColor}`}>{score}</span>
    </div>
  )
}

// Status Badge Component - color coded by category
// Green = Positive, Amber = Pending, Red = Negative, Grey = Duplicate
function StatusBadge({ status }: { status: string | undefined | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>

  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]

  // Color styles by category
  const colorStyles = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    grey: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }

  const style = config ? colorStyles[config.color] : 'bg-gray-100 dark:bg-gray-800'

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${style}`}>
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
  const { leads, isLoading: leadsLoading, updateLead, refreshLeads } = useLeads()
  const { users } = useData()
  const isLoading = leadsLoading
  const refreshData = refreshLeads

  // Initialize state with defaults, will be updated from localStorage
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(DEFAULT_PREFERENCES.quickFilter)
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(DEFAULT_PREFERENCES.filterConditions)
  const [filterLogic, setFilterLogic] = useState<'and' | 'or'>(DEFAULT_PREFERENCES.filterLogic)
  const [sortField, setSortField] = useState<SortField>(DEFAULT_PREFERENCES.sortField)
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_PREFERENCES.sortDirection)
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_PREFERENCES.columns)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PREFERENCES.pageSize)
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, any>>>({})
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [autoScoreEnabled, setAutoScoreEnabled] = useState(true)
  // Store local score results so UI updates immediately (even if DB update fails)
  const [localScores, setLocalScores] = useState<Record<string, { quality: number; intent: number; classification: string }>>({})

  // Auto-score leads without AI scores
  const { isScoring, scoredCount } = useAutoScore({
    leads,
    enabled: autoScoreEnabled && !isLoading && leads.length > 0,
    batchSize: 3,  // Score 3 leads at a time
    delayBetweenBatches: 500,  // 500ms between batches
    onScoreComplete: (results) => {
      const successCount = results.filter(r => r.success).length
      if (successCount > 0) {
        console.log(`[LeadsPage] Auto-scored ${successCount} leads, updating local scores...`)
        // Update local scores immediately for responsive UI
        setLocalScores(prev => {
          const updated = { ...prev }
          results.forEach(r => {
            if (r.success && r.quality_score !== undefined) {
              updated[r.id] = {
                quality: r.quality_score,
                intent: r.intent_score || 0,
                classification: r.classification || '',
              }
            }
          })
          return updated
        })
        // Also refresh from database
        refreshData()
      }
    },
  })

  // Load preferences from localStorage on mount
  useEffect(() => {
    const prefs = loadPreferences()
    setQuickFilter(prefs.quickFilter)
    setFilterConditions(prefs.filterConditions)
    setFilterLogic(prefs.filterLogic)
    setSortField(prefs.sortField)
    setSortDirection(prefs.sortDirection)
    setColumns(prefs.columns)
    setPageSize(prefs.pageSize)
    setPrefsLoaded(true)
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!prefsLoaded) return  // Don't save until initial load is complete
    savePreferences({
      sortField,
      sortDirection,
      quickFilter,
      filterConditions,
      filterLogic,
      columns,
      pageSize,
    })
  }, [prefsLoaded, sortField, sortDirection, quickFilter, filterConditions, filterLogic, columns, pageSize])

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
      // When switching to multi-select operators, initialize value as empty array
      if (updates.operator && (updates.operator === 'is_any_of' || updates.operator === 'is_none_of')) {
        if (!Array.isArray(c.value)) {
          return { ...c, ...updates, value: [] }
        }
      }
      // When switching away from multi-select operators, reset to string
      if (updates.operator && updates.operator !== 'is_any_of' && updates.operator !== 'is_none_of') {
        if (Array.isArray(c.value)) {
          return { ...c, ...updates, value: '' }
        }
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

  // Calculate lead classification counts - exclude duplicates from stats
  // Use local scores if available (fresh from API), otherwise database values, then heuristic
  const leadCounts = useMemo(() => {
    // Filter out duplicates for stats
    const activeLeads = leads.filter((l) => l.status !== 'Duplicate')
    const getScore = (lead: Buyer): number => {
      const local = localScores[lead.id]
      if (local?.quality !== undefined) return local.quality
      if (lead.ai_quality_score !== undefined && lead.ai_quality_score !== null) return lead.ai_quality_score
      if (lead.quality_score !== undefined && lead.quality_score !== null) return lead.quality_score
      // Use heuristic for instant counts
      return calculateHeuristicScore(lead).score
    }
    const hot = activeLeads.filter((l) => getScore(l) >= 70).length
    const warm = activeLeads.filter((l) => { const s = getScore(l); return s >= 45 && s < 70 }).length
    const low = activeLeads.filter((l) => getScore(l) < 45).length
    const duplicates = leads.filter((l) => l.status === 'Duplicate').length
    return { hot, warm, low, total: activeLeads.length, duplicates }
  }, [leads, localScores])

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
      // Exclude disqualified by default (unless specifically filtering for them)
      const isFilteringForDisqualified = filterConditions.some(c => c.field === 'status' && c.value === 'Disqualified')
      if (!isFilteringForDisqualified && lead.status === 'Disqualified') return false

      // Apply quick filter first - use local scores, database scores, or heuristic
      if (quickFilter !== 'all') {
        const local = localScores[lead.id]
        let score: number
        if (local?.quality !== undefined) score = local.quality
        else if (lead.ai_quality_score !== undefined && lead.ai_quality_score !== null) score = lead.ai_quality_score
        else if (lead.quality_score !== undefined && lead.quality_score !== null) score = lead.quality_score
        else score = calculateHeuristicScore(lead).score  // Use heuristic for instant filtering

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
  }, [leads, search, quickFilter, filterConditions, filterLogic, matchesCondition, localScores])

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any = (a as any)[sortField]
      let bVal: any = (b as any)[sortField]
      // Handle lead_score sorting - use local scores, database, or heuristic
      if (sortField === 'lead_score' || sortField === 'quality_score') {
        const aLocal = localScores[a.id]
        const bLocal = localScores[b.id]
        const getScoreVal = (local: typeof aLocal, lead: Buyer): number => {
          if (local?.quality !== undefined) return local.quality
          if (lead.ai_quality_score !== undefined && lead.ai_quality_score !== null) return lead.ai_quality_score
          if (lead.quality_score !== undefined && lead.quality_score !== null) return lead.quality_score
          return calculateHeuristicScore(lead).score  // Use heuristic for sorting
        }
        aVal = getScoreVal(aLocal, a)
        bVal = getScoreVal(bLocal, b)
      }
      if (sortField === 'ai_confidence') { aVal = aVal || 0; bVal = bVal || 0 }
      // Handle date sorting - check both date_added and created_at
      if (sortField === 'created_at') {
        const aDate = (a as any).date_added || a.created_at
        const bDate = (b as any).date_added || b.created_at
        aVal = aDate ? new Date(aDate).getTime() : 0
        bVal = bDate ? new Date(bDate).getTime() : 0
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLeads, sortField, sortDirection, localScores])

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
    // Handle budget - check budget_range first (Supabase field name), then budget
    // Format to use proper M/K notation (e.g., £12M not £12000K)
    if (field === 'budget') {
      if (lead.budget_range) return formatBudgetDisplay(lead.budget_range)
      if (lead.budget) return formatBudgetDisplay(lead.budget)
      if (lead.budget_min && lead.budget_max) {
        const minM = lead.budget_min / 1000000
        const maxM = lead.budget_max / 1000000
        return `£${minM % 1 === 0 ? minM.toFixed(0) : minM.toFixed(1)}M - £${maxM % 1 === 0 ? maxM.toFixed(0) : maxM.toFixed(1)}M`
      }
      if (lead.budget_min) {
        const minM = lead.budget_min / 1000000
        return `£${minM % 1 === 0 ? minM.toFixed(0) : minM.toFixed(1)}M+`
      }
      if (lead.budget_max) {
        const maxM = lead.budget_max / 1000000
        return `Up to £${maxM % 1 === 0 ? maxM.toFixed(0) : maxM.toFixed(1)}M`
      }
      return ''
    }
    // Handle Lead Score - check local scores first (fresh from API), then database values
    // Fall back to heuristic score for instant display
    if (field === 'lead_score') {
      const local = localScores[lead.id]
      if (local?.quality !== undefined) return local.quality
      if (lead.ai_quality_score !== undefined && lead.ai_quality_score !== null) return lead.ai_quality_score
      if (lead.quality_score !== undefined && lead.quality_score !== null) return lead.quality_score
      // Use heuristic score for instant display
      const heuristic = calculateHeuristicScore(lead)
      return heuristic.score
    }
    if (field === 'ai_classification') {
      const local = localScores[lead.id]
      if (local?.classification) return local.classification
      if (lead.ai_classification) return lead.ai_classification
      // Use heuristic classification for instant display
      const heuristic = calculateHeuristicScore(lead)
      return heuristic.classification
    }
    // Handle assigned user - try multiple fields
    if (field === 'assigned_user_name') {
      return lead.assigned_user_name || lead.assigned_user || lead.assigned_to || ''
    }
    // Handle date - check date_added first (Supabase column name)
    if (field === 'created_at') {
      return (lead as any).date_added || lead.created_at || ''
    }
    return (lead as any)[field]
  }

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
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
            {(() => {
              const activeLeads = leads.filter(l => l.status !== 'Disqualified')
              const disqualifiedCount = leads.length - activeLeads.length
              const activeFiltered = filteredLeads.filter(l => l.status !== 'Disqualified')
              if (filteredLeads.length === leads.length) {
                return `${activeLeads.length.toLocaleString()} leads${disqualifiedCount > 0 ? ` (${disqualifiedCount} disqualified hidden)` : ''}`
              }
              return `Showing ${activeFiltered.length.toLocaleString()} of ${activeLeads.length.toLocaleString()} leads`
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-scoring indicator */}
          {isScoring && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
              <Bot className="h-4 w-4 animate-pulse" />
              <span>AI scoring leads...</span>
            </div>
          )}
          {Object.keys(localScores).length > 0 && (
            <div className="text-xs text-muted-foreground">
              {Object.keys(localScores).length} scored
            </div>
          )}
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
                setFilterConditions(prev => [...prev.filter(c => c.field !== 'ai_classification'), { id: generateId(), field: 'ai_classification', operator: 'equals', value: e.target.value }])
              } else {
                setFilterConditions(filterConditions.filter(c => c.field !== 'ai_classification'))
              }
            }}
          >
            <option value="">Class ▾</option>
            {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
                        // Multi-select for is_any_of and is_none_of operators
                        (condition.operator === 'is_any_of' || condition.operator === 'is_none_of') ? (
                          <div className="flex flex-wrap gap-1 min-w-[200px] max-w-[400px] p-2 rounded-md border border-input bg-background">
                            {(fieldConfig.key === 'status' ? STATUS_OPTIONS : fieldConfig.options || []).map((opt) => {
                              const selectedValues = Array.isArray(condition.value) ? condition.value : []
                              const isSelected = selectedValues.includes(opt)
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                  }`}
                                  onClick={() => {
                                    const newValues = isSelected
                                      ? selectedValues.filter((v: string) => v !== opt)
                                      : [...selectedValues, opt]
                                    updateFilterCondition(condition.id, { value: newValues })
                                  }}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                            {Array.isArray(condition.value) && condition.value.length > 0 && (
                              <span className="text-xs text-muted-foreground ml-2 self-center">
                                ({condition.value.length} selected)
                              </span>
                            )}
                          </div>
                        ) : (
                          <select
                            className="px-2 py-1.5 rounded-md border border-input bg-background text-sm min-w-[140px]"
                            value={condition.value as string}
                            onChange={(e) => updateFilterCondition(condition.id, { value: e.target.value })}
                          >
                            <option value="">Select...</option>
                            {(fieldConfig.key === 'status' ? STATUS_OPTIONS : fieldConfig.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        )
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
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => router.push(`/admin/leads/${lead.id}`)}
                                className="font-medium text-left hover:text-primary hover:underline active:text-primary/80 touch-manipulation"
                              >
                                {cellValue || 'Unknown'}
                              </button>
                            </td>
                          )
                        }

                        if (col.key === 'lead_score') {
                          const score = cellValue as number
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              <ScoreIndicator score={score} />
                            </td>
                          )
                        }

                        if (col.key === 'ai_classification') {
                          const classification = cellValue as string | undefined
                          const getClassBadge = (c: string | undefined) => {
                            if (!c) return <span className="text-muted-foreground text-xs">-</span>
                            // Classification badge styles
                            const styles: Record<string, string> = {
                              'Hot': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                              'Warm-Qualified': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
                              'Warm-Engaged': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                              'Nurture': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                              'Cold': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                              'Disqualified': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                            }
                            const shortLabels: Record<string, string> = {
                              'Warm-Qualified': 'Warm-Q',
                              'Warm-Engaged': 'Warm-E',
                            }
                            const style = styles[c] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            const label = shortLabels[c] || c
                            return (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${style}`}>
                                {label}
                              </span>
                            )
                          }
                          return (
                            <td key={col.key} className={`p-3 text-sm ${col.width || ''}`}>
                              {getClassBadge(classification)}
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
                                className="px-2.5 py-1.5 rounded-md border border-input bg-background text-xs font-medium cursor-pointer hover:border-primary/50 min-w-[140px]"
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
                              <span className={col.key === 'email' ? 'text-muted-foreground whitespace-nowrap' : 'whitespace-nowrap'}>
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
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation"><Phone className="h-4 w-4 sm:h-3.5 sm:w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation"><Mail className="h-4 w-4 sm:h-3.5 sm:w-3.5" /></Button>
                          <Button variant="default" size="icon" className="h-8 w-8 sm:h-7 sm:w-7 touch-manipulation" onClick={() => router.push(`/admin/leads/${lead.id}`)}><Eye className="h-4 w-4 sm:h-3.5 sm:w-3.5" /></Button>
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
