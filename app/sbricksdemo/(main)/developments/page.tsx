'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SB_DEMO_DEVELOPMENTS } from '@/lib/demo-data-smartbricks'
import {
  Search,
  Building2,
  MapPin,
  Home,
  Calendar,
} from 'lucide-react'

function formatPriceRange(from?: number | null, to?: number | null) {
  const fmt = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`
  if (from && to) return `${fmt(from)} - ${fmt(to)}`
  if (from) return `From ${fmt(from)}`
  if (to) return `Up to ${fmt(to)}`
  return '-'
}

export default function SBDemoDevelopmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return SB_DEMO_DEVELOPMENTS.filter((dev) => {
      const matchesSearch = !search ||
        dev.name.toLowerCase().includes(search.toLowerCase()) ||
        dev.location.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' ||
        dev.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  const totals = useMemo(() => {
    const totalUnits = filtered.reduce((s, d) => s + d.total_units, 0)
    const available = filtered.reduce((s, d) => s + d.available_units, 0)
    return { count: filtered.length, totalUnits, available, sold: totalUnits - available }
  }, [filtered])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success'
      case 'coming soon': return 'warning'
      case 'sold out': return 'secondary'
      default: return 'muted'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Developments</h2>
        <p className="text-sm text-white/50">
          {totals.count} of 200+ developments · {totals.totalUnits.toLocaleString()} units shown
        </p>
      </div>

      {/* Region badges */}
      <div className="flex items-center gap-2">
        <Badge variant="success">UAE — 200 Active</Badge>
        <Badge variant="warning">UK — 50 Launching Soon</Badge>
        <Badge variant="warning">US — 50 Launching Soon</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-white/50">Shown</span>
          </div>
          <p className="text-2xl font-bold text-white">{totals.count}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-white/50">Total Units</span>
          </div>
          <p className="text-2xl font-bold text-white">{totals.totalUnits.toLocaleString()}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/50">Available</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{totals.available.toLocaleString()}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/50">Sold</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{totals.sold.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search by name, location..."
            className="pl-9 bg-[#111111] border-white/10 text-white placeholder:text-white/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'coming soon', 'sold out'].map((status) => (
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dev) => (
          <div key={dev.id} className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors">
            <div className="h-40 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 relative flex items-center justify-center">
              <Building2 className="h-12 w-12 text-white/20" />
              <Badge variant={getStatusColor(dev.status) as any} className="absolute top-3 right-3">
                {dev.status}
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-white mb-1">{dev.name}</h3>
              <div className="flex items-center gap-1 text-sm text-white/50 mb-3">
                <MapPin className="h-3 w-3" />
                <span>{dev.location}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/10 mb-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">{dev.total_units}</p>
                  <p className="text-xs text-white/40">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-400">{dev.available_units}</p>
                  <p className="text-xs text-white/40">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-amber-400">{dev.total_units - dev.available_units}</p>
                  <p className="text-xs text-white/40">Sold</p>
                </div>
              </div>
              <div className="text-sm mb-2">
                <span className="text-white/50">Price: </span>
                <span className="font-medium text-white">{formatPriceRange(dev.price_from, dev.price_to)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Calendar className="h-3 w-3" />
                <span>Completion: {dev.completion_date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
