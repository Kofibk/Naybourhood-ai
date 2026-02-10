'use client'

import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Sparkles, TrendingUp, Users, Target, Lightbulb, CheckCircle } from 'lucide-react'

// Lightweight query: only fetches the columns needed for insights
async function fetchCampaignSummaries(): Promise<{ company_id: string; status: string; cpl: number }[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = createClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaigns')
    .select('company_id, delivery_status, status, total_spent, spend, number_of_leads, leads')
  if (error) return []
  return (data || []).map(c => {
    const spent = parseFloat(c.total_spent ?? c.spend ?? 0) || 0
    const numLeads = parseFloat(c.number_of_leads ?? c.leads ?? 0) || 0
    return {
      company_id: c.company_id,
      status: c.delivery_status || c.status || 'active',
      cpl: numLeads > 0 ? spent / numLeads : 0,
    }
  })
}

export default function InsightsPage() {
  const { financeLeads, isLoading: financeLoading } = useFinanceLeads()
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaign-summaries'],
    queryFn: fetchCampaignSummaries,
  })
  const isLoading = financeLoading || campaignsLoading
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)

  // Fetch company_id from localStorage or user_profiles
  useEffect(() => {
    const initializeCompany = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            currentUser = JSON.parse(stored)
          }
        } catch { /* ignore */ }
      }

      if (!currentUser?.id) {
        setIsReady(true)
        return
      }

      if (currentUser.company_id) {
        setCompanyId(currentUser.company_id)
        setIsReady(true)
        return
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      }

      setIsReady(true)
    }

    initializeCompany()
  }, [user])

  // Filter data by company_id for multi-tenant (using borrowers for broker)
  const myBorrowers = useMemo(() => {
    if (!companyId) return []
    return financeLeads.filter(lead => lead.company_id === companyId)
  }, [financeLeads, companyId])

  const myCampaigns = useMemo(() => {
    if (!companyId) return []
    return campaigns.filter(c => c.company_id === companyId)
  }, [campaigns, companyId])

  // Calculate real metrics from filtered data
  const metrics = useMemo(() => {
    const totalBorrowers = myBorrowers.length

    // Calculate total loan value
    const totalLoanValue = myBorrowers.reduce((sum, l) => sum + (l.loan_amount || 0), 0)
    const avgLoanValue = totalBorrowers > 0 ? Math.round(totalLoanValue / totalBorrowers) : 0

    const completedBorrowers = myBorrowers.filter(l => l.status === 'Approved' || l.status === 'Completed').length
    const conversionRate = totalBorrowers > 0 ? Math.round((completedBorrowers / totalBorrowers) * 100) : 0

    // Calculate progress rate from processed borrowers
    const processedBorrowers = myBorrowers.filter(l =>
      l.status === 'Processing' || l.status === 'Approved' || l.status === 'Completed'
    ).length
    const progressRate = totalBorrowers > 0 ? Math.round((processedBorrowers / totalBorrowers) * 100) : 0

    return {
      avgLoanValue: avgLoanValue > 0 ? `£${(avgLoanValue / 1000).toFixed(0)}k` : '£0',
      progressRate,
      conversion: conversionRate,
    }
  }, [myBorrowers])

  // Generate dynamic insights from filtered company data
  const insights = useMemo(() => {
    const generatedInsights: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = []

    // Find highest value borrower
    const sortedByLoan = [...myBorrowers].sort((a, b) => (b.loan_amount || 0) - (a.loan_amount || 0))
    const topBorrower = sortedByLoan[0]
    if (topBorrower && (topBorrower.loan_amount || 0) >= 500000) {
      generatedInsights.push({
        title: 'High-Value Borrower',
        description: `${topBorrower.full_name || topBorrower.first_name || 'A borrower'} is seeking £${((topBorrower.loan_amount || 0) / 1000).toFixed(0)}k. Prioritise this application.`,
        priority: 'high',
      })
    }

    // Check for contact pending borrowers
    const pendingCount = myBorrowers.filter(l => l.status === 'Contact Pending' || !l.status).length
    if (pendingCount > 0) {
      generatedInsights.push({
        title: 'Borrowers Awaiting Contact',
        description: `${pendingCount} borrowers need initial contact. Prioritise outreach.`,
        priority: pendingCount > 5 ? 'high' : 'medium',
      })
    }

    // Check for awaiting documents
    const awaitingDocs = myBorrowers.filter(l => l.status === 'Awaiting Documents').length
    if (awaitingDocs > 0) {
      generatedInsights.push({
        title: 'Documents Required',
        description: `${awaitingDocs} borrowers are awaiting document submission. Follow up to keep progress moving.`,
        priority: awaitingDocs > 3 ? 'high' : 'medium',
      })
    }

    // Check campaign performance
    const activeCampaigns = myCampaigns.filter(c => c.status === 'active')
    if (activeCampaigns.length > 0) {
      const avgCPL = activeCampaigns.reduce((sum, c) => sum + (c.cpl || 0), 0) / activeCampaigns.length
      generatedInsights.push({
        title: 'Campaign Performance',
        description: `${activeCampaigns.length} active campaigns with avg £${Math.round(avgCPL)} CPL.`,
        priority: avgCPL > 50 ? 'medium' : 'low',
      })
    }

    // Add general insight if no specific ones
    if (generatedInsights.length === 0) {
      generatedInsights.push({
        title: 'Getting Started',
        description: 'No data available yet. Your borrowers and campaigns will appear here.',
        priority: 'low',
      })
    }

    return generatedInsights
  }, [myBorrowers, myCampaigns])

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold font-display">AI Insights</h2>
          <p className="text-sm text-muted-foreground">Personalised recommendations</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : metrics.avgLoanValue}</div>
            <div className="text-xs text-muted-foreground">Avg Loan Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : myBorrowers.length}</div>
            <div className="text-xs text-muted-foreground">Total Borrowers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${metrics.conversion}%`}</div>
            <div className="text-xs text-muted-foreground">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading insights...</p>
          ) : (
            insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className={`h-5 w-5 mt-0.5 ${insight.priority === 'high' ? 'text-orange-500' : insight.priority === 'medium' ? 'text-yellow-500' : 'text-success'}`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'warning' : 'secondary'} className="text-[10px]">
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
