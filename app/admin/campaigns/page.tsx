'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency, statusIs } from '@/lib/utils'
import { AIOverview } from '@/components/ai/AIOverview'
import { EditableCell } from '@/components/ui/editable-cell'
import type { Campaign } from '@/types'
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Megaphone,
  Users,
  PoundSterling,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Pencil,
} from 'lucide-react'

interface DevelopmentGroup {
  name: string
  campaigns: Campaign[]
  totalSpend: number
  totalLeads: number
  avgCPL: number
  activeCampaigns: number
}

interface NewCampaign {
  name: string
  client: string
  platform: string
  status: string
  spend: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const { campaigns, leads, isLoading, createCampaign, updateCampaign } = useData()
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    name: '',
    client: '',
    platform: 'Meta',
    status: 'active',
    spend: 0,
  })

  // Count leads from buyers table for each campaign
  // Match by: campaign_id, campaign name, development name, or client name
  const leadCountByCampaign = useMemo(() => {
    const counts: Record<string, number> = {}

    // First pass: count leads by their campaign/development field
    const leadsByDevelopment: Record<string, number> = {}
    leads.forEach((lead) => {
      const devName = (lead.campaign || '').toLowerCase().trim()
      if (devName) {
        leadsByDevelopment[devName] = (leadsByDevelopment[devName] || 0) + 1
      }
      // Also count by campaign_id if present
      if (lead.campaign_id) {
        counts[lead.campaign_id] = (counts[lead.campaign_id] || 0) + 1
      }
    })

    // Second pass: match campaigns to lead counts
    campaigns.forEach((campaign) => {
      let matchedLeads = 0

      // Try matching by campaign ID first
      if (counts[campaign.id]) {
        matchedLeads = counts[campaign.id]
      }

      // Try matching by development name (most common for lead data)
      if (matchedLeads === 0 && campaign.development) {
        const devKey = campaign.development.toLowerCase().trim()
        matchedLeads = leadsByDevelopment[devKey] || 0
      }

      // Try matching by client name
      if (matchedLeads === 0 && campaign.client) {
        const clientKey = campaign.client.toLowerCase().trim()
        matchedLeads = leadsByDevelopment[clientKey] || 0
      }

      // Try matching by campaign name
      if (matchedLeads === 0 && campaign.name) {
        const nameKey = campaign.name.toLowerCase().trim()
        matchedLeads = leadsByDevelopment[nameKey] || 0

        // Also try extracting development name from campaign name
        // e.g., "Chelsea Island - Facebook" -> "Chelsea Island"
        if (matchedLeads === 0) {
          const dashMatch = campaign.name.match(/^([^-–]+?)(?:\s*[-–])/)
          if (dashMatch && dashMatch[1]) {
            const extractedDev = dashMatch[1].toLowerCase().trim()
            matchedLeads = leadsByDevelopment[extractedDev] || 0
          }
        }
      }

      if (matchedLeads > 0) {
        counts[campaign.id] = matchedLeads
      }
    })

    return counts
  }, [leads, campaigns])

  // Get actual lead count for a campaign
  const getLeadCount = useCallback((campaign: Campaign): number => {
    return leadCountByCampaign[campaign.id] || 0
  }, [leadCountByCampaign])

  // Handler for inline cell editing
  const handleCellSave = async (rowId: string, field: string, value: string | number): Promise<boolean> => {
    try {
      if (updateCampaign) {
        await updateCampaign(rowId, { [field]: value })
        setMessage({ type: 'success', text: 'Campaign updated successfully!' })
        setTimeout(() => setMessage(null), 2000)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating campaign:', error)
      setMessage({ type: 'error', text: 'Failed to update campaign.' })
      return false
    }
  }

  // Group campaigns by development name (not client)
  const groupedCampaigns = useMemo(() => {
    const groups: Record<string, DevelopmentGroup> = {}

    campaigns.forEach((campaign) => {
      // Try to get development name from multiple fields
      // Priority: development > client > extract from campaign name
      let groupName = campaign.development || campaign.client

      // If no development/client, try to extract development name from campaign name
      // Common patterns: "The Haydon - Facebook", "River Park Tower Campaign"
      if (!groupName && campaign.name) {
        // Try to extract the development name from the campaign name
        const developmentPatterns = [
          /^([^-–]+?)(?:\s*[-–])/,  // Before dash: "The Haydon - Facebook"
          /^(.+?)\s+(?:Campaign|FB|Facebook|Google|Meta|Ads?|Marketing)/i,  // Before keyword
        ]

        for (const pattern of developmentPatterns) {
          const match = campaign.name.match(pattern)
          if (match && match[1] && match[1].trim().length > 2) {
            groupName = match[1].trim()
            break
          }
        }
      }

      // Fallback to "Uncategorized" only if nothing found
      if (!groupName) {
        groupName = 'Uncategorized Campaigns'
      }

      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName,
          campaigns: [],
          totalSpend: 0,
          totalLeads: 0,
          avgCPL: 0,
          activeCampaigns: 0,
        }
      }

      // Count leads from buyers table instead of campaigns table
      const campaignLeads = leadCountByCampaign[campaign.id] || 0

      groups[groupName].campaigns.push(campaign)
      groups[groupName].totalSpend += campaign.spend || 0
      groups[groupName].totalLeads += campaignLeads
      if (statusIs(campaign.status, 'active')) {
        groups[groupName].activeCampaigns++
      }
    })

    // Calculate avg CPL for each group
    Object.values(groups).forEach((group) => {
      group.avgCPL = group.totalLeads > 0
        ? Math.round(group.totalSpend / group.totalLeads)
        : 0
    })

    // Sort by total spend, but put "Uncategorized" at the end
    return Object.values(groups).sort((a, b) => {
      if (a.name === 'Uncategorized Campaigns') return 1
      if (b.name === 'Uncategorized Campaigns') return -1
      return b.totalSpend - a.totalSpend
    })
  }, [campaigns, leadCountByCampaign])

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!search) return groupedCampaigns

    return groupedCampaigns
      .map((group) => ({
        ...group,
        campaigns: group.campaigns.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.client?.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((group) => group.campaigns.length > 0)
  }, [groupedCampaigns, search])

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const totalStats = useMemo(() => ({
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => statusIs(c.status, 'active')).length,
    totalSpend: campaigns.reduce((sum, c) => sum + (c.spend || 0), 0),
    // Use total buyers count for leads
    totalLeads: leads.length,
  }), [campaigns, leads])

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) return
    setIsSaving(true)
    setMessage(null)

    try {
      const result = await createCampaign({
        name: newCampaign.name,
        client: newCampaign.client,
        development: newCampaign.client,
        platform: newCampaign.platform,
        status: newCampaign.status,
        spend: newCampaign.spend,
        leads: 0,
        cpl: 0,
      })

      if (result) {
        setMessage({ type: 'success', text: 'Campaign created successfully!' })
        setIsModalOpen(false)
        setNewCampaign({ name: '', client: '', platform: 'Meta', status: 'active', spend: 0 })
      } else {
        setMessage({ type: 'error', text: 'Failed to create campaign.' })
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      setMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Overview */}
      <AIOverview
        pageType="campaigns"
        className="mb-2"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            {totalStats.totalCampaigns} campaigns across {groupedCampaigns.length} developments
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Pencil className="h-3 w-3" />
            Double-click any cell to edit inline
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
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
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setMessage(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{totalStats.activeCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{totalStats.totalLeads.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Spend</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalStats.totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Avg CPL</span>
            </div>
            <p className="text-2xl font-bold text-success">
              £{totalStats.totalLeads > 0 ? Math.round(totalStats.totalSpend / totalStats.totalLeads) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns or developments..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Grouped Campaigns */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No campaigns found</div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.name)

            return (
              <Card key={group.name}>
                {/* Group Header */}
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleGroup(group.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{group.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {group.campaigns.length} campaigns · {group.activeCampaigns} active
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(group.totalSpend)}</p>
                        <p className="text-xs text-muted-foreground">Spend</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{group.totalLeads.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${group.avgCPL > 50 ? 'text-destructive' : 'text-success'}`}>
                          £{group.avgCPL}
                        </p>
                        <p className="text-xs text-muted-foreground">Avg CPL</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Campaigns */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 border-t pt-4">
                      {group.campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/admin/campaigns/${campaign.id}`)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{campaign.name}</p>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={statusIs(campaign.status, 'active') ? 'success' : 'secondary'}
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
                          <div className="flex items-center gap-6">
                            <div className="text-right" onClick={(e) => e.stopPropagation()}>
                              {(() => {
                                const spend = campaign.spend ?? campaign.amount_spent
                                const hasSpend = spend !== null && spend !== undefined
                                return (
                                  <EditableCell
                                    value={spend || 0}
                                    field="spend"
                                    rowId={campaign.id}
                                    type="number"
                                    onSave={handleCellSave}
                                    displayValue={hasSpend ? formatCurrency(spend) : '-'}
                                    className="text-sm font-medium justify-end"
                                  />
                                )
                              })()}
                              <p className="text-xs text-muted-foreground">Spend</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-primary">
                                {getLeadCount(campaign) || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">Leads</p>
                            </div>
                            <div className="text-right w-16">
                              {(() => {
                                const actualLeads = getLeadCount(campaign)
                                const spend = campaign.spend ?? campaign.amount_spent ?? 0
                                if (actualLeads === 0 || spend === 0) {
                                  return <p className="text-sm font-medium text-muted-foreground">-</p>
                                }
                                const actualCPL = Math.round(spend / actualLeads)
                                return (
                                  <div className="flex items-center justify-end gap-1">
                                    <span className={`text-sm font-medium ${
                                      actualCPL > 50 ? 'text-destructive' : 'text-success'
                                    }`}>
                                      £{actualCPL}
                                    </span>
                                    {actualCPL < 50 ? (
                                      <TrendingDown className="h-3 w-3 text-success" />
                                    ) : (
                                      <TrendingUp className="h-3 w-3 text-destructive" />
                                    )}
                                  </div>
                                )
                              })()}
                              <p className="text-xs text-muted-foreground">CPL</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Create New Campaign</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name *</label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g., The Haydon - Meta Ads"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Development/Client</label>
                <Input
                  value={newCampaign.client}
                  onChange={(e) => setNewCampaign({ ...newCampaign, client: e.target.value })}
                  placeholder="e.g., The Haydon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <select
                    value={newCampaign.platform}
                    onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
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
                    value={newCampaign.status}
                    onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Budget (£)</label>
                <Input
                  type="number"
                  value={newCampaign.spend || ''}
                  onChange={(e) => setNewCampaign({ ...newCampaign, spend: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={isSaving || !newCampaign.name}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
