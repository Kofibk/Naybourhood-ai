'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Home,
  Calendar,
  RefreshCw,
} from 'lucide-react'

export default function DevelopmentsPage() {
  const router = useRouter()
  const { developments, isLoading, refreshData } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter developments
  const filteredDevelopments = useMemo(() => {
    return developments.filter((dev) => {
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
  }, [developments, search, statusFilter])

  // Calculate totals from development data only
  const totals = useMemo(() => {
    const totalUnits = developments.reduce((sum, d) => sum + (d.total_units || d.units || 0), 0)
    const availableUnits = developments.reduce((sum, d) => sum + (d.available_units || 0), 0)
    const soldUnits = totalUnits - availableUnits

    return {
      developments: developments.length,
      totalUnits,
      availableUnits,
      soldUnits: soldUnits > 0 ? soldUnits : 0,
    }
  }, [developments])

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
            {totals.developments} developments · {totals.totalUnits.toLocaleString()} total units
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Development
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <Home className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Sold</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">{totals.soldUnits.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, or developer..."
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
          <Button
            variant={statusFilter === 'sold out' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('sold out')}
          >
            Sold Out
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
                    <h3 className="font-semibold text-lg">{dev.name || 'Unnamed Development'}</h3>
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

                {/* Units Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{dev.total_units || dev.units || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Units</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-success">{dev.available_units || 0}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-500">
                      {(dev.total_units || dev.units || 0) - (dev.available_units || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sold</p>
                  </div>
                </div>

                {/* Price Range */}
                {(dev.price_from || dev.price_to) && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-medium">
                      {dev.price_from || '?'} - {dev.price_to || '?'}
                    </span>
                  </div>
                )}

                {/* Completion Date */}
                {dev.completion_date && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Completion: {dev.completion_date}</span>
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
