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
  ExternalLink,
  Phone,
  Mail,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react'

export default function DevelopmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { developments, campaigns, leads, companies, isLoading, updateDevelopment } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editData, setEditData] = useState<Partial<Development>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

    console.log('[DevDetail] Development:', development.name, 'ID:', development.id)
    console.log('[DevDetail] Total leads available:', leads.length)
    console.log('[DevDetail] Campaign names for this dev:', campaignNames)

    // Debug: Check first few leads for development fields
    if (leads.length > 0) {
      console.log('[DevDetail] Sample lead fields:', {
        development_id: leads[0].development_id,
        development_name: leads[0].development_name,
        campaign: leads[0].campaign,
        campaign_id: leads[0].campaign_id,
        source_campaign: leads[0].source_campaign,
      })
    }

    const filtered = leads.filter((l) => {
      // Direct match by development_id (primary link)
      if (l.development_id === development.id) return true
      // Direct match by development_name
      if (l.development_name && l.development_name.toLowerCase() === development.name.toLowerCase()) return true
      // Match by campaign
      if (l.campaign && campaignNames.includes(l.campaign)) return true
      if (l.campaign_id && campaignIds.includes(l.campaign_id)) return true
      // Match by development name in buyer location/area/notes
      const devNameLower = development.name.toLowerCase()
      if (l.location?.toLowerCase().includes(devNameLower)) return true
      if (l.area?.toLowerCase().includes(devNameLower)) return true
      // Match by source_campaign containing development name
      if (l.source_campaign?.toLowerCase().includes(devNameLower)) return true
      return false
    })

    console.log('[DevDetail] Filtered leads for this development:', filtered.length)
    return filtered
  }, [leads, devCampaigns, development])

  // Calculate stats - use actual lead count from devLeads
  const stats = useMemo(() => {
    const totalSpend = devCampaigns.reduce((sum, c) => sum + (c.spend || c.amount_spent || 0), 0)
    // Use actual leads count instead of campaign leads field
    const totalLeads = devLeads.length
    const activeCampaigns = devCampaigns.filter((c) =>
      c.status === 'active' || c.status === 'Active'
    ).length
    const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
    // Hot leads: scored 80+ (check both ai_quality_score and quality_score)
    const hotLeads = devLeads.filter((l) => {
      const score = l.ai_quality_score ?? l.quality_score
      return score !== null && score !== undefined && score >= 80
    }).length

    return {
      totalSpend,
      totalLeads,
      activeCampaigns,
      avgCPL,
      hotLeads,
    }
  }, [devCampaigns, devLeads])

  const handleEdit = () => {
    if (development) {
      setEditData({ ...development })
      setIsEditing(true)
      setMessage(null)
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
      default:
        return 'muted'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{development.name}</h2>
              <Badge variant={getStatusColor(development.status)}>
                {development.status || 'Active'}
              </Badge>
            </div>
            {development.location && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{development.location}</span>
              </div>
            )}
            {(development.developer || development.company?.name) && (
              <p className="text-sm text-muted-foreground mt-1">
                {development.developer && <>Developed by {development.developer}</>}
                {development.developer && development.company?.name && <> · </>}
                {development.company?.name && <span className="text-primary">{development.company.name}</span>}
              </p>
            )}
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Development
        </Button>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Edit Development</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Developer</label>
                <Input
                  value={editData.developer || ''}
                  onChange={(e) => setEditData({ ...editData, developer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <select
                  value={editData.company_id || ''}
                  onChange={(e) => setEditData({ ...editData, company_id: e.target.value })}
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
                  value={editData.status || ''}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Units</label>
                <Input
                  type="number"
                  value={editData.total_units || editData.units || ''}
                  onChange={(e) => setEditData({ ...editData, total_units: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Units</label>
                <Input
                  type="number"
                  value={editData.available_units || ''}
                  onChange={(e) => setEditData({ ...editData, available_units: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price From</label>
                <Input
                  value={editData.price_from || ''}
                  onChange={(e) => setEditData({ ...editData, price_from: e.target.value })}
                  placeholder="£500,000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price To</label>
                <Input
                  value={editData.price_to || ''}
                  onChange={(e) => setEditData({ ...editData, price_to: e.target.value })}
                  placeholder="£1,500,000"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full min-h-[80px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
              {development.available_units ? development.available_units : '-'}
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
            <p className={`text-2xl font-bold ${
              stats.avgCPL > 50 ? 'text-destructive' : 'text-success'
            }`}>
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
            {development.completion_date && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completion Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{development.completion_date}</p>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {(development.brochure_url || development.floor_plan_url || development.price_list_url || (development.attachments && development.attachments.length > 0)) && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Documents</p>
                <div className="space-y-2">
                  {development.brochure_url && (
                    <a
                      href={development.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <FileText className="h-4 w-4 text-red-500" />
                      <span className="flex-1">Brochure</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {development.floor_plan_url && (
                    <a
                      href={development.floor_plan_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="flex-1">Floor Plans</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {development.price_list_url && (
                    <a
                      href={development.price_list_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <FileText className="h-4 w-4 text-green-500" />
                      <span className="flex-1">Price List</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  )}
                  {development.attachments?.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{attachment.name}</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Campaigns ({devCampaigns.length})</CardTitle>
            <Button size="sm" variant="outline">
              Add Campaign
            </Button>
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
                      <div className="text-right">
                        <p className={`font-medium ${
                          (campaign.cpl || 0) > 50 ? 'text-destructive' : 'text-success'
                        }`}>
                          £{campaign.cpl || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">CPL</p>
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
          <Button size="sm" variant="outline">
            View All
          </Button>
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
                        {lead.phone && <span>· {lead.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {lead.budget && (
                      <Badge variant="muted" className="text-xs">
                        {lead.budget}
                      </Badge>
                    )}
                    {lead.quality_score !== undefined && (
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          lead.quality_score >= 80 ? 'text-success' :
                          lead.quality_score >= 60 ? 'text-warning' : 'text-muted-foreground'
                        }`}>
                          {lead.quality_score}
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
