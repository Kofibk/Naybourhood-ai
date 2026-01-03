'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import type { Development } from '@/types'
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Users,
  PoundSterling,
  Calendar,
  Home,
  Megaphone,
  TrendingUp,
  MoreVertical,
} from 'lucide-react'

export default function DevelopmentsPage() {
  const router = useRouter()
  const { developments, campaigns, leads, isLoading } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Calculate stats for each development
  const developmentsWithStats = useMemo(() => {
    return developments.map((dev) => {
      // Count campaigns for this development
      const devCampaigns = campaigns.filter(
        (c) =>
          c.development === dev.name ||
          c.client === dev.name ||
          c.name?.includes(dev.name)
      )

      // Count leads for this development (via campaigns)
      const devLeads = leads.filter(
        (l) =>
          l.campaign &&
          devCampaigns.some((c) => c.name === l.campaign || c.id === l.campaign_id)
      )

      const totalSpend = devCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
      const totalLeads = devCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0)
      const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0

      return {
        ...dev,
        campaignCount: devCampaigns.length,
        calculatedLeads: totalLeads || dev.total_leads || 0,
        calculatedSpend: totalSpend || dev.total_spend || 0,
        avgCPL,
      }
    })
  }, [developments, campaigns, leads])

  // Filter developments
  const filteredDevelopments = useMemo(() => {
    return developmentsWithStats.filter((dev) => {
      const matchesSearch =
        !search ||
        dev.name.toLowerCase().includes(search.toLowerCase()) ||
        dev.location?.toLowerCase().includes(search.toLowerCase()) ||
        dev.developer?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        dev.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [developmentsWithStats, search, statusFilter])

  // Calculate totals
  const totals = useMemo(() => ({
    developments: developments.length,
    totalUnits: developments.reduce((sum, d) => sum + (d.total_units || d.units || 0), 0),
    availableUnits: developments.reduce((sum, d) => sum + (d.available_units || 0), 0),
    totalSpend: developmentsWithStats.reduce((sum, d) => sum + (d.calculatedSpend || 0), 0),
    totalLeads: developmentsWithStats.reduce((sum, d) => sum + (d.calculatedLeads || 0), 0),
  }), [developments, developmentsWithStats])

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
          <h2 className="text-2xl font-bold font-display">Developments</h2>
          <p className="text-sm text-muted-foreground">
            {totals.developments} developments · {totals.totalUnits} total units
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Development
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Developments</span>
            </div>
            <p className="text-2xl font-bold">{totals.developments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Units</span>
            </div>
            <p className="text-2xl font-bold">{totals.totalUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <p className="text-2xl font-bold text-success">{totals.availableUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{totals.totalLeads.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Spend</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totals.totalSpend)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search developments..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === 'coming soon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('coming soon')}
          >
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Developments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading developments...
          </div>
        ) : filteredDevelopments.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {developments.length === 0
              ? 'No developments found'
              : 'No developments match your search'}
          </div>
        ) : (
          filteredDevelopments.map((dev) => (
            <Card
              key={dev.id}
              className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              onClick={() => router.push(`/admin/developments/${dev.id}`)}
            >
              {/* Development Image */}
              {dev.image_url && (
                <div className="h-32 bg-muted relative">
                  <img
                    src={dev.image_url}
                    alt={dev.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    variant={getStatusColor(dev.status)}
                    className="absolute top-2 right-2"
                  >
                    {dev.status || 'Active'}
                  </Badge>
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{dev.name}</h3>
                    {dev.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{dev.location}</span>
                      </div>
                    )}
                  </div>
                  {!dev.image_url && (
                    <Badge variant={getStatusColor(dev.status)}>
                      {dev.status || 'Active'}
                    </Badge>
                  )}
                </div>

                {dev.developer && (
                  <p className="text-sm text-muted-foreground mb-3">
                    by {dev.developer}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{dev.total_units || dev.units || 0}</p>
                    <p className="text-xs text-muted-foreground">Units</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{dev.campaignCount}</p>
                    <p className="text-xs text-muted-foreground">Campaigns</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{dev.calculatedLeads}</p>
                    <p className="text-xs text-muted-foreground">Leads</p>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Spend: </span>
                    <span className="font-semibold">
                      {formatCurrency(dev.calculatedSpend)}
                    </span>
                  </div>
                  {dev.avgCPL > 0 && (
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold ${
                        dev.avgCPL > 50 ? 'text-destructive' : 'text-success'
                      }`}>
                        £{dev.avgCPL} CPL
                      </span>
                      <TrendingUp className={`h-3 w-3 ${
                        dev.avgCPL > 50 ? 'text-destructive' : 'text-success'
                      }`} />
                    </div>
                  )}
                </div>

                {/* Price Range */}
                {(dev.price_from || dev.price_to) && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Prices from {dev.price_from || '?'} to {dev.price_to || '?'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
