'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import type { Buyer } from '@/types'
import {
  Search,
  Filter,
  MoreVertical,
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
} from 'lucide-react'

type SortField = 'full_name' | 'quality_score' | 'intent_score' | 'budget' | 'status' | 'created_at' | 'source'
type SortDirection = 'asc' | 'desc'
type GroupBy = 'none' | 'status' | 'source' | 'campaign' | 'location' | 'timeline'

interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: string
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'full_name', label: 'Name', visible: true, width: 'w-[200px]' },
  { key: 'email', label: 'Email', visible: true, width: 'w-[200px]' },
  { key: 'phone', label: 'Phone', visible: true, width: 'w-[140px]' },
  { key: 'budget', label: 'Budget', visible: true, width: 'w-[120px]' },
  { key: 'quality_score', label: 'Q Score', visible: true, width: 'w-[80px]' },
  { key: 'intent_score', label: 'I Score', visible: true, width: 'w-[80px]' },
  { key: 'status', label: 'Status', visible: true, width: 'w-[120px]' },
  { key: 'source', label: 'Source', visible: true, width: 'w-[120px]' },
  { key: 'campaign', label: 'Campaign', visible: true, width: 'w-[150px]' },
  { key: 'timeline', label: 'Timeline', visible: false, width: 'w-[120px]' },
  { key: 'location', label: 'Location', visible: false, width: 'w-[150px]' },
  { key: 'bedrooms', label: 'Beds', visible: false, width: 'w-[60px]' },
  { key: 'payment_method', label: 'Payment', visible: false, width: 'w-[120px]' },
  { key: 'mortgage_status', label: 'Mortgage', visible: false, width: 'w-[120px]' },
  { key: 'created_at', label: 'Created', visible: false, width: 'w-[100px]' },
]

const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Viewing Booked', 'Offer Made', 'Completed', 'Lost']
const SOURCE_OPTIONS = ['Facebook', 'Google', 'Instagram', 'Referral', 'Website', 'Other']

export default function LeadsPage() {
  const router = useRouter()
  const { leads, isLoading, refreshData } = useData()

  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sourceFilter, setSourceFilter] = useState<string[]>([])
  const [scoreFilter, setScoreFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')

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

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Text search
      const matchesSearch =
        !search ||
        lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search) ||
        lead.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.last_name?.toLowerCase().includes(search.toLowerCase())

      // Status filter
      const matchesStatus =
        statusFilter.length === 0 ||
        statusFilter.includes(lead.status || 'New')

      // Source filter
      const matchesSource =
        sourceFilter.length === 0 ||
        sourceFilter.includes(lead.source || '')

      // Score filter
      const score = lead.quality_score || 0
      const matchesScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'hot' && score >= 80) ||
        (scoreFilter === 'warm' && score >= 60 && score < 80) ||
        (scoreFilter === 'cold' && score < 60)

      return matchesSearch && matchesStatus && matchesSource && matchesScore
    })
  }, [leads, search, statusFilter, sourceFilter, scoreFilter])

  // Sort leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      // Handle numeric values
      if (sortField === 'quality_score' || sortField === 'intent_score') {
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
  const filterKey = `${search}-${statusFilter.join()}-${sourceFilter.join()}-${scoreFilter}`
  useMemo(() => {
    if (currentPage !== 1) setCurrentPage(1)
  }, [filterKey])

  // Group leads (uses paginated data)
  const groupedLeads = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Leads': paginatedLeads }
    }

    const groups: Record<string, Buyer[]> = {}
    sortedLeads.forEach((lead) => {
      const groupValue = (lead[groupBy as keyof Buyer] as string) || 'Uncategorized'
      if (!groups[groupValue]) {
        groups[groupValue] = []
      }
      groups[groupValue].push(lead)
    })

    return groups
  }, [sortedLeads, groupBy])

  // Stats
  const stats = useMemo(() => ({
    total: leads.length,
    filtered: filteredLeads.length,
    hot: leads.filter((l) => (l.quality_score || 0) >= 80).length,
    new: leads.filter((l) => l.status === 'New').length,
    qualified: leads.filter((l) => l.status === 'Qualified').length,
  }), [leads, filteredLeads])

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

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const toggleSourceFilter = (source: string) => {
    setSourceFilter((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter([])
    setSourceFilter([])
    setScoreFilter('all')
  }

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 80) return 'text-orange-500'
    if (score >= 60) return 'text-success'
    return 'text-muted-foreground'
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'New': return 'warning'
      case 'Contacted': return 'secondary'
      case 'Qualified': return 'success'
      case 'Viewing Booked': return 'default'
      case 'Offer Made': return 'default'
      case 'Completed': return 'success'
      case 'Lost': return 'destructive'
      default: return 'muted'
    }
  }

  const visibleColumns = columns.filter((c) => c.visible)
  const hasActiveFilters = statusFilter.length > 0 || sourceFilter.length > 0 || scoreFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {stats.filtered === stats.total
              ? `${stats.total.toLocaleString()} total leads`
              : `Showing ${stats.filtered.toLocaleString()} of ${stats.total.toLocaleString()} leads`}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setScoreFilter('all')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setScoreFilter('hot')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Hot</span>
            </div>
            <p className="text-xl font-bold text-orange-500">{stats.hot}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setStatusFilter(['New']); setScoreFilter('all') }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">New</span>
            </div>
            <p className="text-xl font-bold text-blue-500">{stats.new}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setStatusFilter(['Qualified']); setScoreFilter('all') }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Qualified</span>
            </div>
            <p className="text-xl font-bold text-success">{stats.qualified}</p>
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
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {statusFilter.length + sourceFilter.length + (scoreFilter !== 'all' ? 1 : 0)}
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
              <option value="campaign">Group by Campaign</option>
              <option value="location">Group by Location</option>
              <option value="timeline">Group by Timeline</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground mb-2 block">Score</span>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'hot', 'warm', 'cold'].map((s) => (
                      <Button
                        key={s}
                        variant={scoreFilter === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScoreFilter(s as any)}
                      >
                        {s === 'hot' && <Flame className="h-3 w-3 mr-1 text-orange-500" />}
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground mb-2 block">Status</span>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter.includes(status) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleStatusFilter(status)}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground mb-2 block">Source</span>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OPTIONS.map((source) => (
                      <Button
                        key={source}
                        variant={sourceFilter.includes(source) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleSourceFilter(source)}
                      >
                        {source}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
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
                        No leads found
                      </td>
                    </tr>
                  ) : (
                    groupLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/leads/${lead.id}`)}
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
                            {col.key === 'budget' && (
                              <span>{lead.budget || '-'}</span>
                            )}
                            {col.key === 'quality_score' && (
                              <span className={`font-medium ${getScoreColor(lead.quality_score)}`}>
                                {lead.quality_score || 0}
                              </span>
                            )}
                            {col.key === 'intent_score' && (
                              <span className={`font-medium ${getScoreColor(lead.intent_score)}`}>
                                {lead.intent_score || 0}
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
                            {col.key === 'campaign' && (
                              <span className="truncate text-muted-foreground">{lead.campaign || '-'}</span>
                            )}
                            {col.key === 'timeline' && (
                              <span>{lead.timeline || '-'}</span>
                            )}
                            {col.key === 'location' && (
                              <span className="truncate">{lead.location || lead.area || '-'}</span>
                            )}
                            {col.key === 'bedrooms' && (
                              <span>{lead.bedrooms || '-'}</span>
                            )}
                            {col.key === 'payment_method' && (
                              <span>{lead.payment_method || '-'}</span>
                            )}
                            {col.key === 'mortgage_status' && (
                              <span>{lead.mortgage_status || '-'}</span>
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
                              onClick={(e) => { e.stopPropagation(); router.push(`/admin/leads/${lead.id}`) }}
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
