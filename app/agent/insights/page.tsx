'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Sparkles, TrendingUp, Users, Target, Lightbulb, CheckCircle } from 'lucide-react'

async function fetchCampaignSummaries(): Promise<{ company_id: string; status: string; cpl: number }[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = createClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaigns')
    .select('company_id, delivery_status, total_spent, spend, number_of_leads, leads')
  if (error) return []
  return (data || []).map((c: any) => {
    const spent = parseFloat(c.total_spent ?? c.spend ?? 0) || 0
    const numLeads = parseFloat(c.number_of_leads ?? c.leads ?? 0) || 0
    return {
      company_id: c.company_id,
      status: c.delivery_status || 'active',
      cpl: numLeads > 0 ? spent / numLeads : 0,
    }
  })
}

export default function InsightsPage() {
  const { leads, isLoading: leadsLoading } = useLeads()
  const { data: campaignSummaries = [], isLoading: dataLoading } = useQuery({
    queryKey: ['campaign-summaries'],
    queryFn: fetchCampaignSummaries,
  })
  const isLoading = leadsLoading || dataLoading
  const { user } = useAuth()

  const myLeads = useMemo(() => {
    if (!user?.company_id) return []
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  const myCampaigns = useMemo(() => {
    if (!user?.company_id) return []
    return campaignSummaries.filter(c => c.company_id === user.company_id)
  }, [campaignSummaries, user?.company_id])

  const metrics = useMemo(() => {
    const totalLeads = myLeads.length
    const avgScore = totalLeads > 0
      ? (myLeads.reduce((sum, l) => sum + (l.quality_score || 0), 0) / totalLeads / 10).toFixed(1)
      : '0'
    const qualifiedLeads = myLeads.filter(l => l.status === 'Qualified' || (l.final_score || l.quality_score || 0) >= 55).length
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0
    return { leadQuality: avgScore, totalLeads, conversion: conversionRate }
  }, [myLeads])

  const insights = useMemo(() => {
    const generatedInsights: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] = []
    const sortedLeads = [...myLeads].sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
    const topLead = sortedLeads[0]
    if (topLead && (topLead.quality_score || 0) >= 55) {
      generatedInsights.push({
        title: 'Hot Lead Alert',
        description: `${topLead.full_name || topLead.first_name || 'A lead'} (Score: ${topLead.quality_score}) is a high-value prospect. Contact immediately.`,
        priority: 'high',
      })
    }
    const newLeadsCount = myLeads.filter(l => l.status === 'New').length
    if (newLeadsCount > 0) {
      generatedInsights.push({
        title: 'New Leads Awaiting',
        description: `${newLeadsCount} new leads need initial contact. Prioritize outreach.`,
        priority: newLeadsCount > 5 ? 'high' : 'medium',
      })
    }
    const activeCampaigns = myCampaigns.filter(c => c.status === 'active')
    if (activeCampaigns.length > 0) {
      const avgCPL = activeCampaigns.reduce((sum, c) => sum + (c.cpl || 0), 0) / activeCampaigns.length
      generatedInsights.push({
        title: 'Campaign Performance',
        description: `${activeCampaigns.length} active campaigns with avg £${Math.round(avgCPL)} CPL.`,
        priority: avgCPL > 50 ? 'medium' : 'low',
      })
    }
    if (generatedInsights.length === 0) {
      generatedInsights.push({
        title: 'Getting Started',
        description: 'No data available yet. Your leads and campaigns will appear here.',
        priority: 'low',
      })
    }
    return generatedInsights
  }, [myLeads, myCampaigns])

  const priorityColors: Record<string, string> = {
    high: 'text-red-400 bg-red-400/10',
    medium: 'text-amber-400 bg-amber-400/10',
    low: 'text-emerald-400 bg-emerald-400/10',
  }
  const priorityIconColors: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-emerald-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Insights</h2>
          <p className="text-sm text-white/50">Personalised recommendations for your portfolio</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-white/50">Lead Quality</span>
          </div>
          <p className="text-3xl font-bold text-white">{isLoading ? '...' : metrics.leadQuality}</p>
          <p className="text-xs text-white/30 mt-1">Average quality score</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-white/50">Total Leads</span>
          </div>
          <p className="text-3xl font-bold text-white">{isLoading ? '...' : metrics.totalLeads}</p>
          <p className="text-xs text-white/30 mt-1">In your pipeline</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/50">Qualified Rate</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{isLoading ? '...' : `${metrics.conversion}%`}</p>
          <p className="text-xs text-white/30 mt-1">Score 70+ or qualified</p>
        </div>
      </div>

      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-white">Recommendations</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                  <div className="h-5 w-5 rounded bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-white/10 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${priorityIconColors[insight.priority]}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-white">{insight.title}</h4>
                    <Badge className={`${priorityColors[insight.priority]} border-0 text-[10px]`}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50">{insight.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
