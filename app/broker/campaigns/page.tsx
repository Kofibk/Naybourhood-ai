'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import {
  Search,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-400/10',
  paused: 'text-amber-400 bg-amber-400/10',
  completed: 'text-blue-400 bg-blue-400/10',
  draft: 'text-white/40 bg-white/5',
}

export default function CampaignsPage() {
  const { campaigns, isLoading } = useCampaigns()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const companyId = user?.company_id
  const myCampaigns = useMemo(() => {
    if (!companyId) return campaigns
    return campaigns.filter(c => c.company_id === companyId)
  }, [campaigns, companyId])

  const filtered = useMemo(() => {
    return myCampaigns.filter(c => {
      const matchesSearch = !search ||
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.platform || '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [myCampaigns, search, statusFilter])

  const stats = useMemo(() => {
    const totalLeads = myCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0)
    return {
      total: myCampaigns.length,
      active: myCampaigns.filter(c => c.status === 'active').length,
      totalLeads,
    }
  }, [myCampaigns])

  if (!companyId && campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaigns</h2>
          <p className="text-sm text-white/50">View referral campaigns</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-12 text-center">
          <Megaphone className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Your account is not linked to a company.</p>
          <p className="text-sm text-white/30 mt-2">Contact an administrator to assign you to a company.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Campaigns</h2>
        <p className="text-sm text-white/50">View referral campaigns</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-white/50">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/50">Active</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/50">Total Leads</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalLeads}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search campaigns..."
            className="pl-9 bg-[#111111] border-white/10 text-white placeholder:text-white/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'paused', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={statusFilter !== status ? 'border-white/10 text-white/70 hover:bg-white/5' : ''}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 rounded-xl p-12 text-center">
            <Megaphone className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">No campaigns found</p>
          </div>
        ) : (
          filtered.map((campaign) => {
            const statusColor = statusColors[campaign.status || 'draft'] || statusColors.draft
            return (
              <div
                key={campaign.id}
                className="bg-[#111111] border border-white/10 rounded-xl p-5 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
                      <Badge className={`${statusColor} border-0 text-[10px]`}>
                        {campaign.status || 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/40">{campaign.platform || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[50px]">
                      <div className="text-lg font-semibold text-white">{campaign.leads || 0}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Leads</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
