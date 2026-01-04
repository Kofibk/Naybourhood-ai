'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Company, Campaign, Buyer } from '@/types'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Megaphone,
  PoundSterling,
  TrendingUp,
  Edit,
} from 'lucide-react'

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<Buyer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!params.id) return

      const supabase = createClient()

      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.id)
        .single()

      if (companyError) {
        console.error('Error fetching company:', companyError)
      } else {
        setCompany(companyData)

        // Fetch related campaigns
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('*')
          .eq('company_id', params.id)
          .order('created_at', { ascending: false })

        if (campaignsData) {
          setCampaigns(campaignsData)
        }

        // Fetch leads from those campaigns
        if (campaignsData && campaignsData.length > 0) {
          const campaignIds = campaignsData.map((c: { id: string }) => c.id)
          const { data: leadsData } = await supabase
            .from('buyers')
            .select('*')
            .in('campaign_id', campaignIds)
            .order('created_at', { ascending: false })
            .limit(10)

          if (leadsData) {
            setLeads(leadsData)
          }
        }
      }

      setIsLoading(false)
    }

    fetchData()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Company not found</p>
      </div>
    )
  }

  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || c.amount_spent || 0), 0)
  const totalLeads = campaigns.reduce((sum, c) => sum + (c.leads || c.lead_count || 0), 0)
  const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0

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
              <h1 className="text-2xl font-bold font-display">{company.name}</h1>
              <Badge variant={company.status === 'active' ? 'success' : 'secondary'}>
                {company.status || 'Active'}
              </Badge>
              {company.tier && (
                <Badge variant="outline">{company.tier}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {company.type || 'Company'} · {campaigns.length} campaigns
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Campaigns</span>
            </div>
            <p className="text-3xl font-bold">{campaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-3xl font-bold">{totalLeads.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Spend</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg CPL</span>
            </div>
            <p className="text-3xl font-bold text-success">£{avgCPL}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contact Name</span>
              <span className="text-sm font-medium">{company.contact_name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{company.contact_email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm font-medium">{company.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Website</span>
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {company.website}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">N/A</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
            ) : (
              campaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.platform} · {campaign.leads || 0} leads
                    </p>
                  </div>
                  <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
              ))
            )}
            {campaigns.length > 5 && (
              <Button variant="outline" className="w-full" size="sm">
                View all {campaigns.length} campaigns
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recent Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => router.push(`/admin/leads/${lead.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{lead.full_name || lead.first_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.budget} · {lead.location || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Q: {lead.quality_score || 0}</span>
                    <Badge variant="outline">{lead.status || 'New'}</Badge>
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
