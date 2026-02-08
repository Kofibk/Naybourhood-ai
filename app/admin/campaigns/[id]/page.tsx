'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useCampaigns } from '@/hooks/useCampaigns'
import { formatCurrency } from '@/lib/utils'
import type { Campaign, Buyer } from '@/types'
import {
  ArrowLeft,
  Megaphone,
  Users,
  PoundSterling,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Calendar,
  Flame,
  Edit,
  Pause,
  Play,
  X,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { updateCampaign } = useCampaigns()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [leads, setLeads] = useState<Buyer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Campaign>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return

      const supabase = createClient()

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single()

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError)
      } else {
        setCampaign(campaignData)

        // Fetch leads for this campaign
        const { data: leadsData } = await supabase
          .from('buyers')
          .select('*')
          .eq('campaign_id', params.id)
          .order('created_at', { ascending: false })

        if (leadsData) {
          setLeads(leadsData)
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [params.id])

  const handleToggleStatus = async () => {
    if (!campaign) return
    setIsUpdating(true)
    setMessage(null)

    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    try {
      const result = await updateCampaign(campaign.id, { status: newStatus })
      if (result) {
        setCampaign({ ...campaign, status: newStatus })
        setMessage({ type: 'success', text: `Campaign ${newStatus === 'active' ? 'activated' : 'paused'} successfully!` })
      } else {
        setMessage({ type: 'error', text: 'Failed to update campaign status.' })
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
      setMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = () => {
    if (campaign) {
      setEditData({ ...campaign })
      setIsEditing(true)
      setMessage(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!campaign) return
    setIsUpdating(true)
    setMessage(null)

    try {
      const result = await updateCampaign(campaign.id, editData)
      if (result) {
        setCampaign({ ...campaign, ...editData })
        setMessage({ type: 'success', text: 'Campaign updated successfully!' })
        setIsEditing(false)
        setEditData({})
      } else {
        setMessage({ type: 'error', text: 'Failed to update campaign.' })
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
      setMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Campaign not found</p>
      </div>
    )
  }

  const spend = campaign.spend || campaign.amount_spent || 0
  const leadCount = campaign.leads || campaign.lead_count || leads.length
  const cpl = campaign.cpl || campaign.cost_per_lead || (leadCount > 0 ? Math.round(spend / leadCount) : 0)
  const hotLeads = leads.filter(l => (l.quality_score || 0) >= 85).length
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified' || (l.quality_score || 0) >= 70).length

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display">{campaign.name}</h1>
              <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'}>
                {campaign.status || 'Active'}
              </Badge>
              {campaign.platform && (
                <Badge variant="outline">{campaign.platform}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {campaign.client} · Started {formatDate(campaign.start_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'active' ? (
            <Button size="sm" variant="outline" onClick={handleToggleStatus} disabled={isUpdating}>
              <Pause className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Pause'}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleToggleStatus} disabled={isUpdating}>
              <Play className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Activate'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleEdit}>
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
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Edit Campaign</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name</label>
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client/Development</label>
                <Input
                  value={editData.client || ''}
                  onChange={(e) => setEditData({ ...editData, client: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <select
                  value={editData.platform || ''}
                  onChange={(e) => setEditData({ ...editData, platform: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select Platform</option>
                  <option value="Meta">Meta</option>
                  <option value="Google">Google</option>
                  <option value="TikTok">TikTok</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Rightmove">Rightmove</option>
                  <option value="Zoopla">Zoopla</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={editData.status || ''}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Spend</label>
                <Input
                  type="number"
                  value={editData.spend || editData.amount_spent || ''}
                  onChange={(e) => setEditData({ ...editData, spend: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Count</label>
                <Input
                  type="number"
                  value={editData.leads || editData.lead_count || ''}
                  onChange={(e) => setEditData({ ...editData, leads: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={isUpdating}>
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Spend</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(spend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Leads</span>
            </div>
            <p className="text-2xl font-bold">{leadCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              {cpl > 50 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingDown className="h-4 w-4 text-success" />
              )}
              <span className="text-xs text-muted-foreground">CPL</span>
            </div>
            <p className={`text-2xl font-bold ${cpl > 50 ? 'text-destructive' : 'text-success'}`}>
              £{cpl}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Impressions</span>
            </div>
            <p className="text-2xl font-bold">{(campaign.impressions || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
            <p className="text-2xl font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">CTR</span>
            </div>
            <p className="text-2xl font-bold">{campaign.ctr || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Quality Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hot Leads (85+)</p>
                <p className="text-3xl font-bold text-orange-500">{hotLeads}</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified Leads</p>
                <p className="text-3xl font-bold text-success">{qualifiedLeads}</p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualification Rate</p>
                <p className="text-3xl font-bold">
                  {leadCount > 0 ? Math.round((qualifiedLeads / leadCount) * 100) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Campaign Leads ({leads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads for this campaign yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Lead</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Budget</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Score</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 20).map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/admin/leads/${lead.id}`)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {(lead.quality_score || 0) >= 85 && (
                            <Flame className="h-4 w-4 text-orange-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {lead.full_name || lead.first_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{lead.budget || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`font-semibold ${
                          (lead.quality_score || 0) >= 85 ? 'text-orange-500' :
                          (lead.quality_score || 0) >= 70 ? 'text-success' : ''
                        }`}>
                          {lead.quality_score || 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">{lead.status || 'New'}</Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length > 20 && (
                <div className="p-3 text-center">
                  <Button variant="outline" size="sm">
                    View all {leads.length} leads
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
