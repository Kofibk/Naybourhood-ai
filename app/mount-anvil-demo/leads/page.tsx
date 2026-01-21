'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import {
  DEMO_DEVELOPMENTS,
  DEMO_BUYERS,
} from '@/lib/mount-anvil-demo-data'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Flame,
  Phone,
  Mail,
  Clock,
  X,
  ArrowUpDown,
  Eye,
  Settings,
  MessageSquare,
} from 'lucide-react'
import { Buyer } from '@/types'

// Wrapper component to handle Suspense
function LeadsPageContent() {
  return <LeadsPageInner />
}

export default function LeadsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LeadsPageContent />
    </Suspense>
  )
}

// Classification badge component
function ClassificationBadge({ classification }: { classification?: string }) {
  const styles: Record<string, string> = {
    'Hot Lead': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Qualified': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Needs Qualification': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Nurture': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Low Priority': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[classification || ''] || styles['Low Priority']}`}>
      {classification === 'Hot Lead' && <Flame className="w-3 h-3" />}
      {classification || 'Unknown'}
    </span>
  )
}

// Status badge component
function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    'Contact Pending': 'bg-slate-500/20 text-slate-400',
    'Follow Up': 'bg-blue-500/20 text-blue-400',
    'Viewing Booked': 'bg-purple-500/20 text-purple-400',
    'Negotiating': 'bg-amber-500/20 text-amber-400',
    'Reserved': 'bg-emerald-500/20 text-emerald-400',
    'Exchanged': 'bg-green-500/20 text-green-400',
    'Completed': 'bg-green-600/20 text-green-400',
    'Not Proceeding': 'bg-red-500/20 text-red-400',
    'Disqualified': 'bg-red-600/20 text-red-400',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[status || ''] || 'bg-slate-500/20 text-slate-400'}`}>
      {status || 'Unknown'}
    </span>
  )
}

function LeadsPageInner() {
  const searchParams = useSearchParams()
  const { user, isLoading } = useMountAnvilDemo()

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDevelopment, setSelectedDevelopment] = useState<string>('all')
  const [selectedClassification, setSelectedClassification] = useState<string>(
    searchParams.get('classification') || 'all'
  )
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let leads = [...DEMO_BUYERS]

    // Filter by development
    if (selectedDevelopment !== 'all') {
      leads = leads.filter(l => l.development_id === selectedDevelopment)
    }

    // Filter by classification
    if (selectedClassification !== 'all') {
      leads = leads.filter(l => l.ai_classification === selectedClassification)
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      leads = leads.filter(l => l.status === selectedStatus)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      leads = leads.filter(l =>
        l.full_name?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.phone?.includes(query)
      )
    }

    // Sort
    leads.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'score':
          comparison = (b.ai_quality_score || 0) - (a.ai_quality_score || 0)
          break
        case 'date':
          comparison = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          break
        case 'name':
          comparison = (a.full_name || '').localeCompare(b.full_name || '')
          break
      }
      return sortOrder === 'desc' ? comparison : -comparison
    })

    return leads
  }, [searchQuery, selectedDevelopment, selectedClassification, selectedStatus, sortBy, sortOrder])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  const classifications = ['Hot Lead', 'Qualified', 'Needs Qualification', 'Nurture', 'Low Priority']
  const statuses = ['Contact Pending', 'Follow Up', 'Viewing Booked', 'Negotiating', 'Reserved', 'Exchanged', 'Completed', 'Not Proceeding', 'Disqualified']

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight">Naybourhood</h1>
              <p className="text-white/40 text-xs">Mount Anvil</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/mount-anvil-demo"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/mount-anvil-demo/leads"
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 rounded-xl"
          >
            <Users className="w-5 h-5" />
            Leads
          </Link>
          <Link
            href="/mount-anvil-demo/campaigns"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            Campaigns
          </Link>
          <Link
            href="/mount-anvil-demo/developments"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Developments
          </Link>
          <Link
            href="/mount-anvil-demo/settings"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.firstName}</p>
              <p className="text-white/40 text-xs">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">Leads</h2>
              <p className="text-white/50 text-sm mt-1">
                {filteredLeads.length} leads found
              </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="px-8 py-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Development Filter */}
            <select
              value={selectedDevelopment}
              onChange={(e) => setSelectedDevelopment(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="all">All Developments</option>
              {DEMO_DEVELOPMENTS.map((dev) => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>

            {/* Classification Filter */}
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="all">All Classifications</option>
              {classifications.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <ArrowUpDown className="w-4 h-4 text-white/40" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'date' | 'name')}
                className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
              >
                <option value="score">Score</option>
                <option value="date">Date</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="text-white/40 hover:text-white"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="p-8">
          <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 font-medium">Lead</th>
                  <th className="px-6 py-4 font-medium">Classification</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Development</th>
                  <th className="px-6 py-4 font-medium">Budget</th>
                  <th className="px-6 py-4 font-medium">Next Action</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => router.push(`/mount-anvil-demo/leads/${lead.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {(lead.first_name || lead.full_name || 'U').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{lead.full_name || 'Unknown'}</p>
                          <p className="text-white/40 text-sm">{lead.email || lead.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ClassificationBadge classification={lead.ai_classification} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          (lead.ai_quality_score || 0) >= 70 ? 'text-emerald-400' :
                          (lead.ai_quality_score || 0) >= 50 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {lead.ai_quality_score || 0}
                        </span>
                        <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (lead.ai_quality_score || 0) >= 70 ? 'bg-emerald-400' :
                              (lead.ai_quality_score || 0) >= 50 ? 'bg-amber-400' : 'bg-slate-400'
                            }`}
                            style={{ width: `${lead.ai_quality_score || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70 text-sm">{lead.development_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70 text-sm">{lead.budget || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/60 text-sm truncate max-w-[150px] block">
                        {lead.ai_next_action || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Would trigger phone call
                          }}
                          className="p-2 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Would open WhatsApp
                          }}
                          className="p-2 text-white/40 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/mount-anvil-demo/leads/${lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="px-6 py-16 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No leads found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedDevelopment('all')
                    setSelectedClassification('all')
                    setSelectedStatus('all')
                  }}
                  className="text-emerald-400 text-sm mt-2 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
