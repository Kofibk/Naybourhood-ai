'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEMO_RECENT_LEADS, DEMO_TOP_CAMPAIGNS, DEMO_BUYER_STATS } from '@/lib/demo-data'
import { Sparkles, Target, Users, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react'

export default function DemoInsightsPage() {
  const stats = DEMO_BUYER_STATS
  const leads = DEMO_RECENT_LEADS
  const campaigns = DEMO_TOP_CAMPAIGNS

  const avgScore = leads.length > 0
    ? (leads.reduce((sum, l) => sum + (l.ai_quality_score || 0), 0) / leads.length).toFixed(0)
    : '0'

  const qualifiedRate = stats.total_leads > 0
    ? Math.round(((stats.hot_leads + stats.qualified) / stats.total_leads) * 100)
    : 0

  const avgCPL = campaigns.filter(c => c.status === 'active').length > 0
    ? Math.round(campaigns.filter(c => c.status === 'active').reduce((sum, c) => sum + c.cpl, 0) / campaigns.filter(c => c.status === 'active').length)
    : 0

  const insights = [
    {
      title: 'Hot Lead Alert: James Richardson',
      description: 'NB Score 92 — Verified cash buyer with £2.8M budget, viewing confirmed for One Clapham penthouse. Solicitor instructed. Contact immediately to close.',
      priority: 'high' as const,
    },
    {
      title: 'Emily Thornton — Ready to Reserve',
      description: 'NB Score 93 — Mortgage AIP secured, solicitor instructed, offer submitted on The Edit 3-bed. High conversion probability. Follow up today.',
      priority: 'high' as const,
    },
    {
      title: 'International Pipeline Strength',
      description: '5 of 8 recent leads are international buyers (HK, UAE, Nigeria, Germany, India). Consider expanding Meta International campaign budget for The Broadley.',
      priority: 'medium' as const,
    },
    {
      title: 'The Edit — Rightmove Outperforming',
      description: 'Rightmove Featured campaign delivering £144 CPL vs £227 for Meta UK. Consider reallocating 20% of Meta budget to Rightmove for The Edit.',
      priority: 'medium' as const,
    },
    {
      title: '147 Leads Awaiting Contact',
      description: `${stats.contact_pending} leads still in "Contact Pending" status. Prioritize high-score leads first — your top pending lead (Mohammed Al-Rashid, Score 84) has a £6-8M budget.`,
      priority: 'high' as const,
    },
    {
      title: 'One Clapham — 84% Sold',
      description: 'Only 32 of 205 units remaining. Consider launching a "final units" campaign to drive urgency. International buyers showing highest interest.',
      priority: 'low' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">AI Insights</h2>
          <p className="text-sm text-white/50">Personalised recommendations powered by NB Score</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-white/40" />
            </div>
            <div className="text-2xl font-bold text-white">{avgScore}</div>
            <div className="text-xs text-white/40">Avg NB Score</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-white/40" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_leads}</div>
            <div className="text-xs text-white/40">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-white/40" />
            </div>
            <div className="text-2xl font-bold text-white">{qualifiedRate}%</div>
            <div className="text-xs text-white/40">Qualified Rate</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
              <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${insight.priority === 'high' ? 'text-orange-500' : insight.priority === 'medium' ? 'text-yellow-500' : 'text-emerald-500'}`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-white">{insight.title}</h4>
                  <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'warning' : 'secondary'} className="text-[10px]">
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">{insight.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
