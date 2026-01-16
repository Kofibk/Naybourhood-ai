'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Company, Campaign, Buyer, AppUser, FinanceLead } from '@/types'
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
  User,
  Eye,
  Landmark,
} from 'lucide-react'

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<Buyer[]>([])
  const [totalLeadCount, setTotalLeadCount] = useState(0)
  const [borrowers, setBorrowers] = useState<FinanceLead[]>([])
  const [companyUsers, setCompanyUsers] = useState<AppUser[]>([])
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

        // Fetch leads - try multiple methods to find all related leads
        let allLeads: Buyer[] = []

        // Method 1: Direct company_id link
        const { data: directLeads } = await supabase
          .from('buyers')
          .select('*')
          .eq('company_id', params.id)
          .order('created_at', { ascending: false })

        if (directLeads && directLeads.length > 0) {
          allLeads = [...directLeads]
        }

        // Method 2: Through campaigns (if company has campaigns)
        if (campaignsData && campaignsData.length > 0) {
          const campaignIds = campaignsData.map((c: { id: string }) => c.id)
          const { data: campaignLeads } = await supabase
            .from('buyers')
            .select('*')
            .in('campaign_id', campaignIds)
            .order('created_at', { ascending: false })

          if (campaignLeads && campaignLeads.length > 0) {
            // Merge and dedupe by id
            const existingIds = new Set(allLeads.map((l: Buyer) => l.id))
            const newLeads = campaignLeads.filter((l: Buyer) => !existingIds.has(l.id))
            allLeads = [...allLeads, ...newLeads]
          }
        }

        // Sort by created_at and take recent 10 for display
        allLeads.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
        setTotalLeadCount(allLeads.length)  // Store full count for stats
        setLeads(allLeads.slice(0, 10))

        // Fetch borrowers (finance leads) linked to this company
        const { data: borrowersData } = await supabase
          .from('borrowers')
          .select('*')
          .eq('company_id', params.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (borrowersData) {
          setBorrowers(borrowersData)
        }

        // Fetch users belonging to this company
        const { data: usersData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('company_id', params.id)
          .order('first_name', { ascending: true })

        if (usersData) {
          const mappedUsers: AppUser[] = usersData.map((u: any) => ({
            id: u.id,
            name: u.first_name && u.last_name
              ? `${u.first_name} ${u.last_name}`
              : u.first_name || u.email?.split('@')[0] || 'Unknown',
            email: u.email || '',
            role: u.user_type || 'developer',
            company_id: u.company_id,
            avatar_url: u.avatar_url,
            status: 'active',
            last_active: u.last_active,
            created_at: u.created_at,
          }))
          setCompanyUsers(mappedUsers)
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
  // Use actual lead count from fetched data (totalLeadCount includes all leads, not just displayed 10)
  const campaignLeadCount = campaigns.reduce((sum, c) => sum + (c.leads || c.lead_count || 0), 0)
  const totalLeads = totalLeadCount > 0 ? totalLeadCount : campaignLeadCount
  const totalBorrowers = borrowers.length
  const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0

  // Determine company type for display (broker companies show borrowers)
  const isBrokerCompany = company.type?.toLowerCase().includes('broker') ||
    company.type?.toLowerCase().includes('financial') ||
    company.name?.toLowerCase().includes('tudor')

  // View as Company function
  const handleViewAsCompany = () => {
    // Store the company info temporarily for viewing as this company
    const viewAsUser = {
      id: `view-as-${company.id}`,
      email: company.contact_email || `admin@${company.name?.toLowerCase().replace(/\s+/g, '')}.com`,
      name: company.contact_name || 'Company User',
      role: isBrokerCompany ? 'broker' : 'developer',
      company: company.name,
      company_id: company.id,
      isViewingAs: true, // Flag to indicate admin is viewing as this company
    }
    localStorage.setItem('naybourhood_user', JSON.stringify(viewAsUser))
    // Navigate to the appropriate dashboard
    const dashboardPath = isBrokerCompany ? '/broker' : '/developer'
    router.push(dashboardPath)
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
              <h1 className="text-2xl font-bold font-display">{company.name}</h1>
              <Badge variant={
                company.status === 'Active' || company.status === 'active' ? 'success' :
                company.status === 'Trial' ? 'warning' : 'secondary'
              }>
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={handleViewAsCompany}>
            <Eye className="h-4 w-4 mr-2" />
            View as Company
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        {isBrokerCompany && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Borrowers</span>
              </div>
              <p className="text-3xl font-bold">{totalBorrowers.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
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

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Team Members ({companyUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companyUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members assigned to this company</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {companyUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Borrowers Section - for broker/financial companies */}
      {isBrokerCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Recent Borrowers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {borrowers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No borrowers yet</p>
            ) : (
              <div className="space-y-3">
                {borrowers.map((borrower) => (
                  <div
                    key={borrower.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={() => router.push(`/admin/borrowers/${borrower.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {borrower.full_name || `${borrower.first_name || ''} ${borrower.last_name || ''}`.trim() || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {borrower.finance_type} · {borrower.loan_amount_display || `£${(borrower.loan_amount || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <Badge variant="outline">{borrower.status || 'New'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
