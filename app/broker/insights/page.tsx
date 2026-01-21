'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { Sparkles, TrendingUp, Users, Target, Lightbulb, CheckCircle } from 'lucide-react'

export default function InsightsPage() {
  const { leads, campaigns, isLoading } = useData()

  // Calculate real metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length
    const avgScore = totalLeads > 0
      ? (leads.reduce((sum, l) => sum + (l.quality_score || 0), 0) / totalLeads / 10).toFixed(1)
      : '0'

    const qualifiedLeads = leads.filter(l => l.status === 'Qualified' || (l.quality_score || 0) >= 70).length
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0

    // Calculate response rate from contacted leads
    const contactedLeads = leads.filter(l => l.status === 'Contacted' || l.status === 'Qualified' || l.status === 'Viewing Booked' || l.last_contact).length
    const responseRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0

    return {
      leadQuality: avgScore,
      responseRate,
      conversion: conversionRate,
    }
  }, [leads])

  // Generate dynamic insights from real data
  const insights = useMemo(() => {
    const generatedInsights: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = []

    // Find top scoring lead
    const topLead = leads.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))[0]
    if (topLead && (topLead.quality_score || 0) >= 80) {
      generatedInsights.push({
        title: 'Hot Lead Alert',
        description: `${topLead.full_name || topLead.first_name || 'A lead'} (Score: ${topLead.quality_score}) is a high-value prospect. Contact immediately.`,
        priority: 'high',
      })
    }

    // Check for new leads needing follow-up
    const newLeadsCount = leads.filter(l => l.status === 'New').length
    if (newLeadsCount > 0) {
      generatedInsights.push({
        title: 'New Leads Awaiting',
        description: `${newLeadsCount} new leads need initial contact. Prioritize outreach.`,
        priority: newLeadsCount > 5 ? 'high' : 'medium',
      })
    }

    // Check campaign performance
    const activeCampaigns = campaigns.filter(c => c.status === 'active')
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
        description: 'Connect your data sources to see personalized AI insights.',
        priority: 'low',
      })
    }

    return generatedInsights
  }, [leads, campaigns])

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
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Target className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? '...' : metrics.leadQuality}</div>
            <div className="text-sm text-muted-foreground mt-1">Lead Quality</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? '...' : leads.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0" />
            </div>
            <div className="text-3xl font-bold">{isLoading ? '...' : `${metrics.conversion}%`}</div>
            <div className="text-sm text-muted-foreground mt-1">Qualified Rate</div>
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
                    <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'warning' : 'secondary'} className="text-xs whitespace-nowrap">
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
