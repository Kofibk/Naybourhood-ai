'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency, formatPriceRange } from '@/lib/utils'
import type { Development } from '@/types'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  PoundSterling,
  Calendar,
  Home,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Edit,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Plus,
  Trash2,
  Tag,
  Power,
  Upload,
  Sparkles,
  Train,
  ExternalLink,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Selling', label: 'Selling' },
  { value: 'Coming Soon', label: 'Coming Soon' },
  { value: 'Launching', label: 'Launching' },
  { value: 'Sold Out', label: 'Sold Out' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Inactive', label: 'Inactive (Deactivated)' },
]

const DEFAULT_TAGS = [
  'First Time Buyers',
  'Investors',
  'Family Oriented',
  'Luxury',
  'City Living',
  'Professionals',
  'Help to Buy',
  'Pet Friendly',
  'Eco-Friendly',
  'Waterside',
]

export default function DevelopmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { developments, campaigns, leads, isLoading, updateDevelopment } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Development>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeEditTab, setActiveEditTab] = useState<'basic' | 'details' | 'media' | 'sales' | 'ai'>('basic')
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [newTag, setNewTag] = useState('')

  const development = useMemo(() => {
    return developments.find((d) => d.id === params.id)
  }, [developments, params.id])

  // Get campaigns for this development
  const devCampaigns = useMemo(() => {
    if (!development) return []
    return campaigns.filter(
      (c) =>
        c.development === development.name ||
        c.client === development.name ||
        c.name?.includes(development.name)
    )
  }, [campaigns, development])

  // Get leads from these campaigns or directly associated with this development
  const devLeads = useMemo(() => {
    if (!development) return []
    const campaignNames = devCampaigns.map(c => c.name).filter(Boolean)
    const campaignIds = devCampaigns.map(c => c.id).filter(Boolean)

    return leads.filter((l) => {
      if (l.campaign && campaignNames.includes(l.campaign)) return true
      if (l.campaign_id && campaignIds.includes(l.campaign_id)) return true
      const devNameLower = development.name.toLowerCase()
      if (l.location?.toLowerCase().includes(devNameLower)) return true
      if (l.area?.toLowerCase().includes(devNameLower)) return true
      return false
    })
  }, [leads, devCampaigns, development])

  // Calculate stats
  const stats = useMemo(() => {
    const totalSpend = devCampaigns.reduce((sum, c) => sum + (c.spend || c.amount_spent || 0), 0)
    const totalLeads = devLeads.length
    const activeCampaigns = devCampaigns.filter((c) =>
      c.status === 'active' || c.status === 'Active'
    ).length
    const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
    const hotLeads = devLeads.filter((l) => {
      const score = l.ai_quality_score ?? l.quality_score
      return score !== null && score !== undefined && score >= 80
    }).length

    return { totalSpend, totalLeads, activeCampaigns, avgCPL, hotLeads }
  }, [devCampaigns, devLeads])

  const handleEdit = () => {
    if (development) {
      setEditData({ ...development })
      setIsEditing(true)
      setMessage(null)
      setActiveEditTab('basic')
    }
  }

  const handleSave = async () => {
    if (!development) return
    setIsSaving(true)
    setMessage(null)

    try {
      const result = await updateDevelopment(development.id, editData)
      if (result) {
        setMessage({ type: 'success', text: 'Development updated successfully!' })
        setIsEditing(false)
        setEditData({})
      } else {
        setMessage({ type: 'error', text: 'Failed to update development.' })
      }
    } catch (error) {
      console.error('Error updating development:', error)
      setMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!development) return
    setIsSaving(true)
    setMessage(null)

    try {
      const newStatus = development.status === 'Inactive' ? 'Active' : 'Inactive'
      const result = await updateDevelopment(development.id, { status: newStatus })
      if (result) {
        setMessage({ type: 'success', text: `Development ${newStatus === 'Inactive' ? 'deactivated' : 'activated'}!` })
        setShowDeactivateConfirm(false)
      } else {
        setMessage({ type: 'error', text: 'Failed to update status.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return
    const currentTags = (editData.features || development?.features || []) as string[]
    if (!currentTags.includes(newTag.trim())) {
      setEditData({ ...editData, features: [...currentTags, newTag.trim()] })
    }
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    const currentTags = (editData.features || development?.features || []) as string[]
    setEditData({ ...editData, features: currentTags.filter(t => t !== tag) })
  }

  const handleAddPresetTag = (tag: string) => {
    const currentTags = (editData.features || development?.features || []) as string[]
    if (!currentTags.includes(tag)) {
      setEditData({ ...editData, features: [...currentTags, tag] })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!development) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Development not found</h3>
            <p className="text-muted-foreground">
              This development may have been removed or does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
      case 'inactive':
        return 'destructive'
      default:
        return 'muted'
    }
  }

  const displayData = isEditing ? { ...development, ...editData } : development
  const tags = (displayData.features || []) as string[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold">{development.name}</h2>
              <Badge variant={getStatusColor(development.status)}>
                {development.status || 'Active'}
              </Badge>
            </div>
            {development.location && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{development.borough || development.location}</span>
                {development.postcode && <span className="text-xs">({development.postcode})</span>}
              </div>
            )}
            {development.developer && (
              <p className="text-sm text-muted-foreground mt-1">
                by {development.developer}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={development.status === 'Inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDeactivateConfirm(true)}
          >
            <Power className="h-4 w-4 mr-2" />
            {development.status === 'Inactive' ? 'Activate' : 'Deactivate'}
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{message.text}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setMessage(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">
                {development.status === 'Inactive' ? 'Activate' : 'Deactivate'} Development?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {development.status === 'Inactive'
                  ? 'This will make the development visible and available again.'
                  : 'This will hide the development from active listings. You can reactivate it later.'}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant={development.status === 'Inactive' ? 'default' : 'destructive'}
                  onClick={handleDeactivate}
                  disabled={isSaving}
                >
                  {isSaving ? 'Updating...' : development.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Form Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Edit Development</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-4 overflow-x-auto">
              {[
                { key: 'basic', label: 'Basic Info' },
                { key: 'details', label: 'Details & Pricing' },
                { key: 'media', label: 'Media & Docs' },
                { key: 'sales', label: 'Sales & Tags' },
                { key: 'ai', label: 'AI Agent' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveEditTab(tab.key as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeEditTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeEditTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <Input
                        value={editData.name ?? displayData.name ?? ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={editData.status ?? displayData.status ?? 'Active'}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location / Area</label>
                      <Input
                        value={editData.location ?? displayData.location ?? ''}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        placeholder="e.g., Aldgate, London"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Borough</label>
                      <Input
                        value={editData.borough ?? displayData.borough ?? ''}
                        onChange={(e) => setEditData({ ...editData, borough: e.target.value })}
                        placeholder="e.g., Tower Hamlets"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input
                        value={editData.address ?? displayData.address ?? ''}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Postcode</label>
                      <Input
                        value={editData.postcode ?? displayData.postcode ?? ''}
                        onChange={(e) => setEditData({ ...editData, postcode: e.target.value })}
                        placeholder="e.g., E1 8FA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Developer</label>
                      <Input
                        value={editData.developer ?? displayData.developer ?? ''}
                        onChange={(e) => setEditData({ ...editData, developer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Completion Quarter</label>
                      <Input
                        value={editData.completion_quarter ?? displayData.completion_quarter ?? ''}
                        onChange={(e) => setEditData({ ...editData, completion_quarter: e.target.value })}
                        placeholder="e.g., Q2 2025"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Units</label>
                      <Input
                        type="number"
                        value={editData.total_units ?? displayData.total_units ?? displayData.units ?? ''}
                        onChange={(e) => setEditData({ ...editData, total_units: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available Units</label>
                      <Input
                        type="number"
                        value={editData.available_units ?? displayData.available_units ?? ''}
                        onChange={(e) => setEditData({ ...editData, available_units: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price From</label>
                      <Input
                        value={editData.price_from ?? displayData.price_from ?? ''}
                        onChange={(e) => setEditData({ ...editData, price_from: e.target.value })}
                        placeholder="£500,000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price To</label>
                      <Input
                        value={editData.price_to ?? displayData.price_to ?? ''}
                        onChange={(e) => setEditData({ ...editData, price_to: e.target.value })}
                        placeholder="£1,500,000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Charge</label>
                      <Input
                        value={editData.service_charge ?? displayData.service_charge ?? ''}
                        onChange={(e) => setEditData({ ...editData, service_charge: e.target.value })}
                        placeholder="£6.50 per sqft"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ground Rent</label>
                      <Input
                        value={editData.ground_rent ?? displayData.ground_rent ?? ''}
                        onChange={(e) => setEditData({ ...editData, ground_rent: e.target.value })}
                        placeholder="Peppercorn or £500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tenure</label>
                      <select
                        value={editData.tenure ?? displayData.tenure ?? ''}
                        onChange={(e) => setEditData({ ...editData, tenure: e.target.value })}
                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="Leasehold">Leasehold</option>
                        <option value="Freehold">Freehold</option>
                        <option value="Share of Freehold">Share of Freehold</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lease Length (years)</label>
                      <Input
                        type="number"
                        value={editData.lease_length ?? displayData.lease_length ?? ''}
                        onChange={(e) => setEditData({ ...editData, lease_length: parseInt(e.target.value) || 0 })}
                        placeholder="999"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Description</label>
                    <Input
                      value={editData.short_description ?? displayData.short_description ?? ''}
                      onChange={(e) => setEditData({ ...editData, short_description: e.target.value })}
                      placeholder="Brief one-liner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Description</label>
                    <textarea
                      value={editData.description ?? displayData.description ?? ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amenities (comma-separated)</label>
                    <Input
                      value={Array.isArray(editData.amenities) ? editData.amenities.join(', ') : (Array.isArray(displayData.amenities) ? displayData.amenities.join(', ') : '')}
                      onChange={(e) => setEditData({ ...editData, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Gym, Concierge, Rooftop Terrace"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nearby Stations (comma-separated)</label>
                    <Input
                      value={Array.isArray(editData.nearby_stations) ? editData.nearby_stations.join(', ') : (Array.isArray(displayData.nearby_stations) ? displayData.nearby_stations.join(', ') : '')}
                      onChange={(e) => setEditData({ ...editData, nearby_stations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Aldgate East (3 min), Liverpool Street (8 min)"
                    />
                  </div>
                </div>
              )}

              {activeEditTab === 'media' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Main Image URL</label>
                    <Input
                      value={editData.image_url ?? displayData.image_url ?? ''}
                      onChange={(e) => setEditData({ ...editData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                    {(editData.image_url ?? displayData.image_url) && (
                      <div className="mt-2 h-32 bg-muted rounded-md overflow-hidden">
                        <img src={editData.image_url ?? displayData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video URL</label>
                    <Input
                      value={editData.video_url ?? displayData.video_url ?? ''}
                      onChange={(e) => setEditData({ ...editData, video_url: e.target.value })}
                      placeholder="YouTube or Vimeo link"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Virtual Tour URL</label>
                    <Input
                      value={editData.virtual_tour_url ?? displayData.virtual_tour_url ?? ''}
                      onChange={(e) => setEditData({ ...editData, virtual_tour_url: e.target.value })}
                      placeholder="Matterport or similar"
                    />
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-3">Documents</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Brochure URL (PDF)</label>
                        <Input
                          value={editData.brochure_url ?? displayData.brochure_url ?? ''}
                          onChange={(e) => setEditData({ ...editData, brochure_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Floor Plans URL (PDF)</label>
                        <Input
                          value={editData.floor_plan_url ?? displayData.floor_plan_url ?? ''}
                          onChange={(e) => setEditData({ ...editData, floor_plan_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Price List URL (PDF)</label>
                        <Input
                          value={editData.price_list_url ?? displayData.price_list_url ?? ''}
                          onChange={(e) => setEditData({ ...editData, price_list_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Specification URL (PDF)</label>
                        <Input
                          value={editData.specification_url ?? displayData.specification_url ?? ''}
                          onChange={(e) => setEditData({ ...editData, specification_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'sales' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sales Agent</label>
                      <Input
                        value={editData.sales_agent ?? displayData.sales_agent ?? ''}
                        onChange={(e) => setEditData({ ...editData, sales_agent: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sales Phone</label>
                      <Input
                        value={editData.sales_phone ?? displayData.sales_phone ?? ''}
                        onChange={(e) => setEditData({ ...editData, sales_phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sales Email</label>
                      <Input
                        value={editData.sales_email ?? displayData.sales_email ?? ''}
                        onChange={(e) => setEditData({ ...editData, sales_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Viewing Availability</label>
                      <Input
                        value={editData.viewing_availability ?? displayData.viewing_availability ?? ''}
                        onChange={(e) => setEditData({ ...editData, viewing_availability: e.target.value })}
                        placeholder="Mon-Sat, 10am-6pm"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags for Buyer Matching
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tags help the AI agent match this development with suitable buyers.
                    </p>

                    {/* Current Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(editData.features ?? displayData.features ?? []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {String(tag)}
                          <button onClick={() => handleRemoveTag(String(tag))} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {tags.length === 0 && (
                        <span className="text-xs text-muted-foreground">No tags added yet</span>
                      )}
                    </div>

                    {/* Add Custom Tag */}
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add custom tag..."
                        className="flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button size="sm" onClick={handleAddTag} disabled={!newTag.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Preset Tags */}
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_TAGS.filter(tag => !(editData.features ?? displayData.features ?? []).includes(tag)).map((tag) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAddPresetTag(tag)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'ai' && (
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
                      value={editData.ai_target_audience ?? displayData.ai_target_audience ?? ''}
                      onChange={(e) => setEditData({ ...editData, ai_target_audience: e.target.value })}
                      placeholder="Young professionals, First-time buyers, Investors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Sales Pitch</label>
                    <textarea
                      value={editData.ai_pitch ?? displayData.ai_pitch ?? ''}
                      onChange={(e) => setEditData({ ...editData, ai_pitch: e.target.value })}
                      className="w-full min-h-[150px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                      placeholder="Key talking points for the AI agent..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Key Selling Points (comma-separated)</label>
                    <Input
                      value={Array.isArray(editData.key_selling_points) ? editData.key_selling_points.join(', ') : (Array.isArray(displayData.key_selling_points) ? displayData.key_selling_points.join(', ') : '')}
                      onChange={(e) => setEditData({ ...editData, key_selling_points: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="24hr Concierge, Private gym, Rooftop views"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
              <div className="flex gap-2">
                {activeEditTab !== 'basic' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = ['basic', 'details', 'media', 'sales', 'ai']
                      const idx = tabs.indexOf(activeEditTab)
                      if (idx > 0) setActiveEditTab(tabs[idx - 1] as any)
                    }}
                  >
                    Previous
                  </Button>
                )}
                {activeEditTab !== 'ai' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabs = ['basic', 'details', 'media', 'sales', 'ai']
                      const idx = tabs.indexOf(activeEditTab)
                      if (idx < tabs.length - 1) setActiveEditTab(tabs[idx + 1] as any)
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      {development.image_url && (
        <Card className="overflow-hidden">
          <img
            src={development.image_url}
            alt={development.name}
            className="w-full h-64 object-cover"
          />
        </Card>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {String(tag)}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Units</span>
            </div>
            <p className="text-2xl font-bold">
              {(development.total_units || development.units) ? (development.total_units || development.units) : '-'}
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
              {development.available_units !== undefined ? development.available_units : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Campaigns</span>
            </div>
            <p className="text-2xl font-bold">{devCampaigns.length}</p>
            <p className="text-xs text-muted-foreground">{stats.activeCampaigns} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalLeads}</p>
            <p className="text-xs text-orange-500">{stats.hotLeads} hot</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Spend</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {stats.avgCPL > 50 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
              <span className="text-xs text-muted-foreground">Avg CPL</span>
            </div>
            <p className={`text-2xl font-bold ${stats.avgCPL > 50 ? 'text-destructive' : 'text-success'}`}>
              £{stats.avgCPL}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Development Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Development Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {development.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{development.description}</p>
              </div>
            )}
            {(development.price_from || development.price_to) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                <p className="text-sm font-medium">
                  {formatPriceRange(development.price_from, development.price_to)}
                </p>
              </div>
            )}
            {development.tenure && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tenure</p>
                <p className="text-sm font-medium">
                  {development.tenure}
                  {development.lease_length ? ` (${development.lease_length} years)` : ''}
                </p>
              </div>
            )}
            {(development.service_charge || development.ground_rent) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Charges</p>
                <p className="text-sm">
                  {development.service_charge && <span>Service: {development.service_charge}</span>}
                  {development.service_charge && development.ground_rent && <span> · </span>}
                  {development.ground_rent && <span>Ground Rent: {development.ground_rent}</span>}
                </p>
              </div>
            )}
            {(development.completion_quarter || development.completion_date) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completion</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {development.completion_quarter || development.completion_date}
                  </p>
                </div>
              </div>
            )}
            {development.amenities && development.amenities.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {development.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {development.nearby_stations && development.nearby_stations.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Transport</p>
                <div className="space-y-1">
                  {development.nearby_stations.map((station, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Train className="h-3 w-3 text-muted-foreground" />
                      {station}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {(development.brochure_url || development.floor_plan_url || development.price_list_url || development.specification_url) && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Documents</p>
                <div className="space-y-2">
                  {development.brochure_url && (
                    <a href={development.brochure_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="flex-1">Brochure</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {development.floor_plan_url && (
                    <a href={development.floor_plan_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="flex-1">Floor Plans</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {development.price_list_url && (
                    <a href={development.price_list_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="flex-1">Price List</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {development.specification_url && (
                    <a href={development.specification_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <span className="flex-1">Specification</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* AI Info */}
            {development.ai_pitch && (
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Agent Info</span>
                </div>
                {development.ai_target_audience && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Target: {development.ai_target_audience}
                  </p>
                )}
                <p className="text-sm">{development.ai_pitch}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Campaigns ({devCampaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {devCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No campaigns for this development
              </p>
            ) : (
              <div className="space-y-3">
                {devCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={campaign.status === 'active' ? 'success' : 'secondary'}
                            className="text-[10px]"
                          >
                            {campaign.status}
                          </Badge>
                          {campaign.platform && (
                            <Badge variant="outline" className="text-[10px]">
                              {campaign.platform}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(campaign.spend || 0)}</p>
                        <p className="text-xs text-muted-foreground">Spend</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{campaign.leads || 0}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent Leads ({devLeads.length})</CardTitle>
          {devLeads.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => router.push('/admin/leads')}>
              View All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {devLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No leads for this development yet
            </p>
          ) : (
            <div className="space-y-3">
              {devLeads.slice(0, 10).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {lead.email && <span>{lead.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {(lead.ai_quality_score ?? lead.quality_score) !== undefined && (
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          (lead.ai_quality_score ?? lead.quality_score ?? 0) >= 80 ? 'text-success' :
                          (lead.ai_quality_score ?? lead.quality_score ?? 0) >= 60 ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                          {lead.ai_quality_score ?? lead.quality_score}
                        </p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    )}
                    <Badge variant={lead.status === 'New' ? 'warning' : 'secondary'}>
                      {lead.status || 'New'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
