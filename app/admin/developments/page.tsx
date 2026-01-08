'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Users,
  PoundSterling,
  Eye,
  FileText,
  Train,
  Sparkles,
} from 'lucide-react'
import type { Development } from '@/types'

interface NewDevelopment {
  name: string
  location: string
  address: string
  postcode: string
  borough: string
  developer: string
  status: string
  total_units: number
  available_units: number
  price_from: string
  price_to: string
  service_charge: string
  ground_rent: string
  tenure: string
  lease_length: number
  completion_date: string
  completion_quarter: string
  description: string
  short_description: string
  key_selling_points: string
  amenities: string
  transport_links: string
  nearby_stations: string
  image_url: string
  brochure_url: string
  floor_plan_url: string
  price_list_url: string
  sales_agent: string
  sales_phone: string
  sales_email: string
  viewing_availability: string
  ai_pitch: string
  ai_target_audience: string
}

const initialDevelopment: NewDevelopment = {
  name: '',
  location: '',
  address: '',
  postcode: '',
  borough: '',
  developer: '',
  status: 'Active',
  total_units: 0,
  available_units: 0,
  price_from: '',
  price_to: '',
  service_charge: '',
  ground_rent: '',
  tenure: 'Leasehold',
  lease_length: 999,
  completion_date: '',
  completion_quarter: '',
  description: '',
  short_description: '',
  key_selling_points: '',
  amenities: '',
  transport_links: '',
  nearby_stations: '',
  image_url: '',
  brochure_url: '',
  floor_plan_url: '',
  price_list_url: '',
  sales_agent: '',
  sales_phone: '',
  sales_email: '',
  viewing_availability: '',
  ai_pitch: '',
  ai_target_audience: '',
}

export default function DevelopmentsPage() {
  const router = useRouter()
  const { developments, leads, campaigns, isLoading, refreshData, createDevelopment } = useData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newDev, setNewDev] = useState<NewDevelopment>(initialDevelopment)
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'media' | 'sales' | 'ai'>('basic')

  // Filter developments
  const filteredDevelopments = useMemo(() => {
    return developments.filter((dev) => {
      const matchesSearch =
        !search ||
        dev.name?.toLowerCase().includes(search.toLowerCase()) ||
        dev.location?.toLowerCase().includes(search.toLowerCase()) ||
        dev.developer?.toLowerCase().includes(search.toLowerCase()) ||
        dev.borough?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        dev.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [developments, search, statusFilter])

  // Calculate stats for each development
  const developmentStats = useMemo(() => {
    const stats: Record<string, { leads: number; spend: number; hotLeads: number }> = {}

    developments.forEach(dev => {
      const devName = dev.name?.toLowerCase() || ''

      // Count leads mentioning this development
      const devLeads = leads.filter(l => {
        const campaign = l.campaign?.toLowerCase() || ''
        const location = l.location?.toLowerCase() || ''
        const area = l.area?.toLowerCase() || ''
        return campaign.includes(devName) || location.includes(devName) || area.includes(devName)
      })

      const hotLeads = devLeads.filter(l => {
        const score = l.ai_quality_score ?? l.quality_score
        return score !== null && score !== undefined && score >= 70
      })

      // Calculate spend from campaigns
      const devCampaigns = campaigns.filter(c => {
        const campaignDev = c.development?.toLowerCase() || ''
        const campaignClient = c.client?.toLowerCase() || ''
        const campaignName = c.name?.toLowerCase() || ''
        return campaignDev.includes(devName) || campaignClient.includes(devName) || campaignName.includes(devName)
      })
      const totalSpend = devCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)

      stats[dev.id] = {
        leads: devLeads.length,
        spend: totalSpend,
        hotLeads: hotLeads.length,
      }
    })

    return stats
  }, [developments, leads, campaigns])

  // Calculate totals
  const totals = useMemo(() => {
    const devsWithUnits = developments.filter(d => d.total_units || d.units)
    const totalUnits = devsWithUnits.reduce((sum, d) => sum + (d.total_units || d.units || 0), 0)
    const devsWithAvailable = developments.filter(d => d.available_units !== undefined && d.available_units !== null)
    const availableUnits = devsWithAvailable.reduce((sum, d) => sum + (d.available_units || 0), 0)
    const soldUnits = totalUnits - availableUnits
    const totalLeads = Object.values(developmentStats).reduce((sum, s) => sum + s.leads, 0)
    const totalSpend = Object.values(developmentStats).reduce((sum, s) => sum + s.spend, 0)

    return {
      developments: developments.length,
      totalUnits,
      availableUnits,
      soldUnits: soldUnits > 0 ? soldUnits : 0,
      totalLeads,
      totalSpend,
      hasUnitData: devsWithUnits.length > 0,
      hasAvailableData: devsWithAvailable.length > 0,
    }
  }, [developments, developmentStats])

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
    if (!newDev.name) {
      setMessage({ type: 'error', text: 'Development name is required' })
      return
    }
    setIsSaving(true)
    setMessage(null)

    try {
      // Convert comma-separated strings to arrays
      const developmentData: Partial<Development> = {
        name: newDev.name,
        location: newDev.location || undefined,
        address: newDev.address || undefined,
        postcode: newDev.postcode || undefined,
        borough: newDev.borough || undefined,
        developer: newDev.developer || undefined,
        status: newDev.status,
        total_units: newDev.total_units || 0,
        available_units: newDev.available_units || 0,
        price_from: newDev.price_from || undefined,
        price_to: newDev.price_to || undefined,
        service_charge: newDev.service_charge || undefined,
        ground_rent: newDev.ground_rent || undefined,
        tenure: newDev.tenure || undefined,
        lease_length: newDev.lease_length || undefined,
        completion_date: newDev.completion_date || undefined,
        completion_quarter: newDev.completion_quarter || undefined,
        description: newDev.description || undefined,
        short_description: newDev.short_description || undefined,
        key_selling_points: newDev.key_selling_points ? newDev.key_selling_points.split(',').map(s => s.trim()) : undefined,
        amenities: newDev.amenities ? newDev.amenities.split(',').map(s => s.trim()) : undefined,
        transport_links: newDev.transport_links ? newDev.transport_links.split(',').map(s => s.trim()) : undefined,
        nearby_stations: newDev.nearby_stations ? newDev.nearby_stations.split(',').map(s => s.trim()) : undefined,
        image_url: newDev.image_url || undefined,
        brochure_url: newDev.brochure_url || undefined,
        floor_plan_url: newDev.floor_plan_url || undefined,
        price_list_url: newDev.price_list_url || undefined,
        sales_agent: newDev.sales_agent || undefined,
        sales_phone: newDev.sales_phone || undefined,
        sales_email: newDev.sales_email || undefined,
        viewing_availability: newDev.viewing_availability || undefined,
        ai_pitch: newDev.ai_pitch || undefined,
        ai_target_audience: newDev.ai_target_audience || undefined,
      }

      const result = await createDevelopment(developmentData)

      if (result) {
        setMessage({ type: 'success', text: 'Development created successfully!' })
        setIsModalOpen(false)
        setNewDev(initialDevelopment)
        setActiveTab('basic')
      } else {
        setMessage({ type: 'error', text: 'Failed to create development. Check console for details.' })
      }
    } catch (error) {
      console.error('Error creating development:', error)
      setMessage({ type: 'error', text: 'An error occurred while creating the development.' })
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Developments</h2>
          <p className="text-sm text-muted-foreground">
            Property database for AI agent · {totals.developments} developments
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
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setMessage(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <span className="text-xs text-muted-foreground">Sold/Reserved</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {totals.hasUnitData && totals.hasAvailableData ? totals.soldUnits.toLocaleString() : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{totals.totalLeads}</p>
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
            placeholder="Search by name, location, borough, or developer..."
            className="pl-9"
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
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
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
              ? 'No developments found. Add your first development to get started.'
              : 'No developments match your search'}
          </div>
        ) : (
          filteredDevelopments.map((dev) => {
            const stats = developmentStats[dev.id] || { leads: 0, spend: 0, hotLeads: 0 }

            return (
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
                      {(dev.location || dev.borough) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{dev.borough || dev.location}</span>
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
                      <p className="text-lg font-semibold">
                        {(dev.total_units || dev.units) ? (dev.total_units || dev.units) : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-success">
                        {dev.available_units !== undefined ? dev.available_units : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-orange-500">
                        {stats.leads}
                      </p>
                      <p className="text-xs text-muted-foreground">Leads</p>
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

                  {/* AI & Documents indicators */}
                  <div className="mt-3 flex items-center gap-2">
                    {dev.ai_pitch && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Ready
                      </Badge>
                    )}
                    {(dev.brochure_url || dev.floor_plan_url) && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        Docs
                      </Badge>
                    )}
                    {dev.nearby_stations?.length && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Train className="h-3 w-3" />
                        Transport
                      </Badge>
                    )}
                  </div>

                  {/* Completion Date */}
                  {(dev.completion_quarter || dev.completion_date) && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Completion: {dev.completion_quarter || dev.completion_date}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Development Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Add New Development</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-4">
              {[
                { key: 'basic', label: 'Basic Info' },
                { key: 'details', label: 'Details' },
                { key: 'media', label: 'Media & Docs' },
                { key: 'sales', label: 'Sales' },
                { key: 'ai', label: 'AI Agent' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'basic' && (
                <div className="space-y-4">
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
                      <label className="text-sm font-medium">Location / Area</label>
                      <Input
                        value={newDev.location}
                        onChange={(e) => setNewDev({ ...newDev, location: e.target.value })}
                        placeholder="e.g., Aldgate, London"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Borough</label>
                      <Input
                        value={newDev.borough}
                        onChange={(e) => setNewDev({ ...newDev, borough: e.target.value })}
                        placeholder="e.g., Tower Hamlets"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input
                        value={newDev.address}
                        onChange={(e) => setNewDev({ ...newDev, address: e.target.value })}
                        placeholder="Full street address"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Postcode</label>
                      <Input
                        value={newDev.postcode}
                        onChange={(e) => setNewDev({ ...newDev, postcode: e.target.value })}
                        placeholder="e.g., E1 8FA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Developer</label>
                      <Input
                        value={newDev.developer}
                        onChange={(e) => setNewDev({ ...newDev, developer: e.target.value })}
                        placeholder="e.g., Berkeley Group"
                      />
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
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Charge (per sqft/year)</label>
                      <Input
                        value={newDev.service_charge}
                        onChange={(e) => setNewDev({ ...newDev, service_charge: e.target.value })}
                        placeholder="£6.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ground Rent (per year)</label>
                      <Input
                        value={newDev.ground_rent}
                        onChange={(e) => setNewDev({ ...newDev, ground_rent: e.target.value })}
                        placeholder="£500 or Peppercorn"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tenure</label>
                      <select
                        value={newDev.tenure}
                        onChange={(e) => setNewDev({ ...newDev, tenure: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="Leasehold">Leasehold</option>
                        <option value="Freehold">Freehold</option>
                        <option value="Share of Freehold">Share of Freehold</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lease Length (years)</label>
                      <Input
                        type="number"
                        value={newDev.lease_length || ''}
                        onChange={(e) => setNewDev({ ...newDev, lease_length: parseInt(e.target.value) || 0 })}
                        placeholder="999"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Completion Date</label>
                      <Input
                        type="date"
                        value={newDev.completion_date}
                        onChange={(e) => setNewDev({ ...newDev, completion_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Completion Quarter</label>
                      <Input
                        value={newDev.completion_quarter}
                        onChange={(e) => setNewDev({ ...newDev, completion_quarter: e.target.value })}
                        placeholder="e.g., Q2 2025"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Description (for listings)</label>
                    <Input
                      value={newDev.short_description}
                      onChange={(e) => setNewDev({ ...newDev, short_description: e.target.value })}
                      placeholder="Brief one-liner about the development"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Description</label>
                    <textarea
                      value={newDev.description}
                      onChange={(e) => setNewDev({ ...newDev, description: e.target.value })}
                      className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                      placeholder="Detailed description of the development..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Selling Points (comma-separated)</label>
                    <Input
                      value={newDev.key_selling_points}
                      onChange={(e) => setNewDev({ ...newDev, key_selling_points: e.target.value })}
                      placeholder="High ceilings, Balcony, Parking included, Zone 1 location"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amenities (comma-separated)</label>
                    <Input
                      value={newDev.amenities}
                      onChange={(e) => setNewDev({ ...newDev, amenities: e.target.value })}
                      placeholder="Gym, Concierge, Rooftop Terrace, Residents Lounge"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nearby Stations (comma-separated)</label>
                    <Input
                      value={newDev.nearby_stations}
                      onChange={(e) => setNewDev({ ...newDev, nearby_stations: e.target.value })}
                      placeholder="Aldgate East (3 min), Liverpool Street (8 min)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transport Links (comma-separated)</label>
                    <Input
                      value={newDev.transport_links}
                      onChange={(e) => setNewDev({ ...newDev, transport_links: e.target.value })}
                      placeholder="Hammersmith & City, District, Circle"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Main Image URL</label>
                    <Input
                      value={newDev.image_url}
                      onChange={(e) => setNewDev({ ...newDev, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                    {newDev.image_url && (
                      <div className="mt-2 h-32 bg-muted rounded-md overflow-hidden">
                        <img src={newDev.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brochure URL (PDF)</label>
                    <Input
                      value={newDev.brochure_url}
                      onChange={(e) => setNewDev({ ...newDev, brochure_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Floor Plans URL (PDF)</label>
                    <Input
                      value={newDev.floor_plan_url}
                      onChange={(e) => setNewDev({ ...newDev, floor_plan_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price List URL (PDF)</label>
                    <Input
                      value={newDev.price_list_url}
                      onChange={(e) => setNewDev({ ...newDev, price_list_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sales Agent Name</label>
                    <Input
                      value={newDev.sales_agent}
                      onChange={(e) => setNewDev({ ...newDev, sales_agent: e.target.value })}
                      placeholder="Primary contact for viewings"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sales Phone</label>
                      <Input
                        value={newDev.sales_phone}
                        onChange={(e) => setNewDev({ ...newDev, sales_phone: e.target.value })}
                        placeholder="+44 20 7123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sales Email</label>
                      <Input
                        value={newDev.sales_email}
                        onChange={(e) => setNewDev({ ...newDev, sales_email: e.target.value })}
                        placeholder="sales@development.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Viewing Availability</label>
                    <Input
                      value={newDev.viewing_availability}
                      onChange={(e) => setNewDev({ ...newDev, viewing_availability: e.target.value })}
                      placeholder="Monday to Saturday, 10am - 6pm"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">AI Agent Configuration</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Configure how the AI agent should present this development to potential buyers.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Audience</label>
                    <Input
                      value={newDev.ai_target_audience}
                      onChange={(e) => setNewDev({ ...newDev, ai_target_audience: e.target.value })}
                      placeholder="e.g., Young professionals, First-time buyers, Investors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Sales Pitch</label>
                    <textarea
                      value={newDev.ai_pitch}
                      onChange={(e) => setNewDev({ ...newDev, ai_pitch: e.target.value })}
                      className="w-full min-h-[150px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                      placeholder="Write the key talking points and sales pitch the AI should use when discussing this development with leads. Include unique selling points, lifestyle benefits, and investment potential..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
              <div className="flex gap-2">
                {activeTab !== 'basic' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = ['basic', 'details', 'media', 'sales', 'ai']
                      const currentIndex = tabs.indexOf(activeTab)
                      if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1] as any)
                    }}
                  >
                    Previous
                  </Button>
                )}
                {activeTab !== 'ai' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = ['basic', 'details', 'media', 'sales', 'ai']
                      const currentIndex = tabs.indexOf(activeTab)
                      if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1] as any)
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateDevelopment} disabled={isSaving || !newDev.name}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Creating...' : 'Create Development'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
