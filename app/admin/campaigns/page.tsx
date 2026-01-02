'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
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
} from 'lucide-react'

interface DevelopmentGroup {
  name: string
  campaigns: Campaign[]
  totalSpend: number
  totalLeads: number
  avgCPL: number
  activeCampaigns: number
}

export default function CampaignsPage() {
  const router = useRouter()
  const { campaigns, isLoading } = useData()
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Group campaigns by client/development
  const groupedCampaigns = useMemo(() => {
    const groups: Record<string, DevelopmentGroup> = {}

    campaigns.forEach((campaign) => {
      const groupName = campaign.client || 'Other Campaigns'

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

      groups[groupName].campaigns.push(campaign)
      groups[groupName].totalSpend += campaign.spend || campaign.amount_spent || 0
      groups[groupName].totalLeads += campaign.leads || campaign.lead_count || 0
      if (campaign.status === 'active') {
        groups[groupName].activeCampaigns++
      }
    })

    // Calculate avg CPL for each group
    Object.values(groups).forEach((group) => {
      group.avgCPL = group.totalLeads > 0
        ? Math.round(group.totalSpend / group.totalLeads)
        : 0
    })

    return Object.values(groups).sort((a, b) => b.totalSpend - a.totalSpend)
  }, [campaigns])

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
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    totalSpend: campaigns.reduce((sum, c) => sum + (c.spend || c.amount_spent || 0), 0),
    totalLeads: campaigns.reduce((sum, c) => sum + (c.leads || c.lead_count || 0), 0),
  }), [campaigns])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            {totalStats.totalCampaigns} campaigns across {groupedCampaigns.length} developments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

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
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(campaign.spend || campaign.amount_spent || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">Spend</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {campaign.leads || campaign.lead_count || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">Leads</p>
                            </div>
                            <div className="text-right w-16">
                              <div className="flex items-center justify-end gap-1">
                                <span className={`text-sm font-medium ${
                                  (campaign.cpl || 0) > 50 ? 'text-destructive' : 'text-success'
                                }`}>
                                  £{campaign.cpl || campaign.cost_per_lead || 0}
                                </span>
                                {(campaign.cpl || 0) < 50 ? (
                                  <TrendingDown className="h-3 w-3 text-success" />
                                ) : (
                                  <TrendingUp className="h-3 w-3 text-destructive" />
                                )}
                              </div>
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
    </div>
  )
}
