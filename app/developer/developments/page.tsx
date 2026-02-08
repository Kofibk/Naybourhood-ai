'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useDevelopments } from '@/hooks/useDevelopments'
import { formatPriceRange } from '@/lib/utils'
import {
  Search,
  Building2,
  MapPin,
  Home,
  Calendar,
  RefreshCw,
  ExternalLink,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'
import Image from 'next/image'

export default function DeveloperDevelopmentsPage() {
  const { developments, isLoading, refreshDevelopments } = useDevelopments()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyId, setCompanyId] = useState<string | undefined>()

  // Get company_id from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('naybourhood_user')
      if (stored) {
        const user = JSON.parse(stored)
        setCompanyId(user.company_id)
      }
    } catch { /* ignore */ }
  }, [])

  // Filter developments by company and search
  const filteredDevelopments = useMemo(() => {
    return developments.filter((dev) => {
      // Filter by company
      if (companyId && dev.company_id !== companyId) return false

      const matchesSearch =
        !search ||
        dev.name?.toLowerCase().includes(search.toLowerCase()) ||
        dev.location?.toLowerCase().includes(search.toLowerCase()) ||
        dev.developer?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        dev.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [developments, search, statusFilter, companyId])

  // Calculate totals
  const totals = useMemo(() => {
    const devs = filteredDevelopments
    const devsWithUnits = devs.filter(d => d.total_units || d.units)
    const totalUnits = devsWithUnits.reduce((sum, d) => sum + (d.total_units || d.units || 0), 0)
    const devsWithAvailable = devs.filter(d => d.available_units !== undefined)
    const availableUnits = devsWithAvailable.reduce((sum, d) => sum + (d.available_units || 0), 0)
    const soldUnits = totalUnits - availableUnits

    return {
      developments: devs.length,
      totalUnits,
      availableUnits,
      soldUnits: soldUnits > 0 ? soldUnits : 0,
      hasUnitData: devsWithUnits.length > 0,
      hasAvailableData: devsWithAvailable.length > 0,
    }
  }, [filteredDevelopments])

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'selling':
        return 'success'
      case 'coming soon':
      case 'launching':
        return 'warning'
      case 'sold out':
      case 'completed':
        return 'secondary'
      default:
        return 'muted'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Developments</h2>
          <p className="text-sm text-white/50">
            {totals.developments} developments · {totals.totalUnits.toLocaleString()} total units
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshDevelopments()}
          disabled={isLoading}
          className="border-white/10 text-white hover:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-white/50">Developments</span>
          </div>
          <p className="text-2xl font-bold text-white">{totals.developments}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-white/50">Total Units</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {totals.hasUnitData ? totals.totalUnits.toLocaleString() : '-'}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/50">Available</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {totals.hasAvailableData ? totals.availableUnits.toLocaleString() : '-'}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/50">Sold</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {totals.hasUnitData && totals.hasAvailableData ? totals.soldUnits.toLocaleString() : '-'}
          </p>
        </div>
      </div>

      {/* Filters */}
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
        <div className="flex gap-2 flex-wrap">
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

      {/* Developments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && filteredDevelopments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">
            Loading developments...
          </div>
        ) : filteredDevelopments.length === 0 ? (
          <div className="col-span-full text-center py-12 text-white/40">
            {developments.length === 0
              ? 'No developments found'
              : 'No developments match your search'}
          </div>
        ) : (
          filteredDevelopments.map((dev) => (
            <div
              key={dev.id}
              className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors"
            >
              {/* Development Image */}
              {dev.image_url ? (
                <div className="h-40 bg-white/5 relative">
                  <Image
                    src={dev.image_url}
                    alt={dev.name}
                    fill
                    className="object-cover"
                  />
                  <Badge
                    variant={getStatusColor(dev.status)}
                    className="absolute top-3 right-3"
                  >
                    {dev.status || 'Active'}
                  </Badge>
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 relative flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-white/20" />
                  <Badge
                    variant={getStatusColor(dev.status)}
                    className="absolute top-3 right-3"
                  >
                    {dev.status || 'Active'}
                  </Badge>
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-lg text-white mb-1">{dev.name || 'Unnamed'}</h3>
                {dev.location && (
                  <div className="flex items-center gap-1 text-sm text-white/50 mb-3">
                    <MapPin className="h-3 w-3" />
                    <span>{dev.location}</span>
                  </div>
                )}

                {/* Units Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/10 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white">
                      {(dev.total_units || dev.units) ? (dev.total_units || dev.units) : '-'}
                    </p>
                    <p className="text-xs text-white/40">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-emerald-400">
                      {dev.available_units !== undefined ? dev.available_units : '-'}
                    </p>
                    <p className="text-xs text-white/40">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-amber-400">
                      {(dev.total_units || dev.units) && dev.available_units !== undefined
                        ? (dev.total_units || dev.units || 0) - (dev.available_units || 0)
                        : '-'}
                    </p>
                    <p className="text-xs text-white/40">Sold</p>
                  </div>
                </div>

                {/* Price Range */}
                {(dev.price_from || dev.price_to) && (
                  <div className="text-sm mb-2">
                    <span className="text-white/50">Price: </span>
                    <span className="font-medium text-white">
                      {formatPriceRange(dev.price_from, dev.price_to)}
                    </span>
                  </div>
                )}

                {/* Completion Date */}
                {dev.completion_date && (
                  <div className="flex items-center gap-1 text-xs text-white/40 mb-3">
                    <Calendar className="h-3 w-3" />
                    <span>Completion: {dev.completion_date}</span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  {dev.brochure_url && (
                    <a
                      href={dev.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      Brochure
                    </a>
                  )}
                  {dev.floor_plan_url && (
                    <a
                      href={dev.floor_plan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:underline"
                    >
                      <ImageIcon className="h-3 w-3" />
                      Floor Plans
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
