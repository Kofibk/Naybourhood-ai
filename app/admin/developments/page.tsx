'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatPriceRange } from '@/lib/utils'
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Home,
  Calendar,
  RefreshCw,
  X,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface NewDevelopment {
  name: string
  location: string
  developer: string
  company_id: string
  status: string
  total_units: number
  available_units: number
  price_from: string
  price_to: string
}

export default function DevelopmentsPage() {
  const router = useRouter()
  const { developments, companies, isLoading, refreshData, createDevelopment } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newDev, setNewDev] = useState<NewDevelopment>({
    name: '',
    location: '',
    developer: '',
    company_id: '',
    status: 'Active',
    total_units: 0,
    available_units: 0,
    price_from: '',
    price_to: '',
  })

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
    // Only count units from developments that have unit data
    const devsWithUnits = developments.filter(d => d.total_units || d.units)
    const totalUnits = devsWithUnits.reduce((sum, d) => sum + (d.total_units || d.units || 0), 0)
    const devsWithAvailable = developments.filter(d => d.available_units !== undefined && d.available_units !== null)
    const availableUnits = devsWithAvailable.reduce((sum, d) => sum + (d.available_units || 0), 0)
    const soldUnits = totalUnits - availableUnits

    return {
      developments: developments.length,
      totalUnits,
      availableUnits,
      soldUnits: soldUnits > 0 ? soldUnits : 0,
      hasUnitData: devsWithUnits.length > 0,
      hasAvailableData: devsWithAvailable.length > 0,
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

  const handleCreateDevelopment = async () => {
    if (!newDev.name) return
    setIsSaving(true)
    setMessage(null)

    try {
      const result = await createDevelopment({
        name: newDev.name,
        location: newDev.location,
        developer: newDev.developer,
        company_id: newDev.company_id || undefined,
        status: newDev.status,
        total_units: newDev.total_units,
        available_units: newDev.available_units,
        price_from: newDev.price_from,
        price_to: newDev.price_to,
      })

      if (result) {
        setMessage({ type: 'success', text: 'Development created successfully!' })
        setIsModalOpen(false)
        setNewDev({
          name: '', location: '', developer: '', company_id: '', status: 'Active',
          total_units: 0, available_units: 0, price_from: '', price_to: '',
        })
      } else {
        setMessage({ type: 'error', text: 'Failed to create development.' })
      }
    } catch (error) {
      console.error('Error creating development:', error)
      setMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsSaving(false)
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Development
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{message.text}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setMessage(null)} aria-label="Dismiss message">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

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
            <p className="text-2xl font-bold">
              {totals.hasUnitData ? totals.totalUnits.toLocaleString() : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <p className="text-2xl font-bold text-success">
              {totals.hasAvailableData ? totals.availableUnits.toLocaleString() : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Sold</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {totals.hasUnitData && totals.hasAvailableData ? totals.soldUnits.toLocaleString() : '-'}
            </p>
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

                {(dev.developer || dev.company?.name) && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {dev.developer && <>by {dev.developer}</>}
                    {dev.developer && dev.company?.name && <> · </>}
                    {dev.company?.name && <span className="text-primary">{dev.company.name}</span>}
                  </p>
                )}

                {/* Units Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-border">
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {(dev.total_units || dev.units) ? (dev.total_units || dev.units) : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Units</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-success">
                      {dev.available_units ? dev.available_units : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-blue-500">
                      {(dev.total_units || dev.units) && dev.available_units !== undefined
                        ? (dev.total_units || dev.units || 0) - (dev.available_units || 0)
                        : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Sold</p>
                  </div>
                </div>

                {/* Price Range */}
                {(dev.price_from || dev.price_to) && (
                  <div className="mt-3 text-sm">
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-medium">
                      {formatPriceRange(dev.price_from, dev.price_to)}
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

      {/* Create Development Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
              <h3 className="font-semibold">Add New Development</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} aria-label="Close modal">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Development Name *</label>
                <Input
                  value={newDev.name}
                  onChange={(e) => setNewDev({ ...newDev, name: e.target.value })}
                  placeholder="e.g., The Haydon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={newDev.location}
                    onChange={(e) => setNewDev({ ...newDev, location: e.target.value })}
                    placeholder="e.g., London, E1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Developer</label>
                  <Input
                    value={newDev.developer}
                    onChange={(e) => setNewDev({ ...newDev, developer: e.target.value })}
                    placeholder="e.g., Berkeley Group"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <select
                  value={newDev.company_id}
                  onChange={(e) => setNewDev({ ...newDev, company_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newDev.status}
                  onChange={(e) => setNewDev({ ...newDev, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Selling">Selling</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Launching">Launching</option>
                  <option value="Sold Out">Sold Out</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Units</label>
                  <Input
                    type="number"
                    value={newDev.total_units || ''}
                    onChange={(e) => setNewDev({ ...newDev, total_units: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available Units</label>
                  <Input
                    type="number"
                    value={newDev.available_units || ''}
                    onChange={(e) => setNewDev({ ...newDev, available_units: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price From</label>
                  <Input
                    value={newDev.price_from}
                    onChange={(e) => setNewDev({ ...newDev, price_from: e.target.value })}
                    placeholder="£500,000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price To</label>
                  <Input
                    value={newDev.price_to}
                    onChange={(e) => setNewDev({ ...newDev, price_to: e.target.value })}
                    placeholder="£1,500,000"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border sticky bottom-0 bg-background">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateDevelopment} disabled={isSaving || !newDev.name}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Creating...' : 'Create Development'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
