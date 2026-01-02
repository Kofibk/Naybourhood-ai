'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
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
} from 'lucide-react'

export default function DevelopmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { developments, campaigns, leads, isLoading } = useData()

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

  // Get leads from these campaigns
  const devLeads = useMemo(() => {
    if (!development) return []
    return leads.filter(
      (l) =>
        l.campaign &&
        devCampaigns.some((c) => c.name === l.campaign || c.id === l.campaign_id)
    )
  }, [leads, devCampaigns, development])

  // Calculate stats
  const stats = useMemo(() => {
    const totalSpend = devCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
    const totalLeads = devCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0)
    const activeCampaigns = devCampaigns.filter((c) =>
      c.status === 'active' || c.status === 'Active'
    ).length
    const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
    const hotLeads = devLeads.filter((l) => (l.quality_score || 0) >= 80).length

    return {
      totalSpend,
      totalLeads,
      activeCampaigns,
      avgCPL,
      hotLeads,
    }
  }, [devCampaigns, devLeads])

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
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
            {development.developer && (
              <p className="text-sm text-muted-foreground mt-1">
                Developed by {development.developer}
              </p>
            )}
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Development
        </Button>
      </div>

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
              {development.total_units || development.units || 0}
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
              {development.available_units || 0}
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
                  {development.price_from || '?'} - {development.price_to || '?'}
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
