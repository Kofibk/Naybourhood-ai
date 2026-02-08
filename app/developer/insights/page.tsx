'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { Sparkles, TrendingUp, Users, Target, Lightbulb, CheckCircle } from 'lucide-react'

export default function InsightsPage() {
  const { leads, isLoading: leadsLoading } = useLeads()
  const { campaigns, isLoading: dataLoading } = useData()
  const isLoading = leadsLoading || dataLoading
  const { user } = useAuth()

  // Filter data by company_id for multi-tenant
  const myLeads = useMemo(() => {
    if (!user?.company_id) return []
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  const myCampaigns = useMemo(() => {
    if (!user?.company_id) return []
    return campaigns.filter(c => c.company_id === user.company_id)
  }, [campaigns, user?.company_id])

  // Calculate real metrics from filtered data
  const metrics = useMemo(() => {
    const totalLeads = myLeads.length
    const avgScore = totalLeads > 0
      ? (myLeads.reduce((sum, l) => sum + (l.quality_score || 0), 0) / totalLeads / 10).toFixed(1)
      : '0'

    const qualifiedLeads = myLeads.filter(l => l.status === 'Qualified' || (l.quality_score || 0) >= 70).length
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0

    // Calculate response rate from contacted leads
    const contactedLeads = myLeads.filter(l => l.status === 'Contacted' || l.status === 'Qualified' || l.status === 'Viewing Booked' || l.last_contact).length
    const responseRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0

    return {
      leadQuality: avgScore,
      responseRate,
      conversion: conversionRate,
    }
  }, [myLeads])

  // Generate dynamic insights from filtered company data
  const insights = useMemo(() => {
    const generatedInsights: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = []

    // Find top scoring lead
    const sortedLeads = [...myLeads].sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    const topLead = sortedLeads[0]
    if (topLead && (topLead.quality_score || 0) >= 80) {
      generatedInsights.push({
        title: 'Hot Lead Alert',
        description: `${topLead.full_name || topLead.first_name || 'A lead'} (Score: ${topLead.quality_score}) is a high-value prospect. Contact immediately.`,
        priority: 'high',
      })
    }

    // Check for new leads needing follow-up
    const newLeadsCount = myLeads.filter(l => l.status === 'New').length
    if (newLeadsCount > 0) {
      generatedInsights.push({
        title: 'New Leads Awaiting',
        description: `${newLeadsCount} new leads need initial contact. Prioritize outreach.`,
        priority: newLeadsCount > 5 ? 'high' : 'medium',
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
        description: 'No data available yet. Your leads and campaigns will appear here.',
        priority: 'low',
      })
    }

    return generatedInsights
  }, [myLeads, myCampaigns])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold font-display">AI Insights</h2>
          <p className="text-sm text-muted-foreground">Personalized recommendations</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : metrics.leadQuality}</div>
            <div className="text-xs text-muted-foreground">Lead Quality</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : myLeads.length}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${metrics.conversion}%`}</div>
            <div className="text-xs text-muted-foreground">Qualified Rate</div>
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
