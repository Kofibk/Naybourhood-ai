'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SB_DEMO_RECENT_LEADS, SB_DEMO_TOP_CAMPAIGNS, SB_DEMO_BUYER_STATS } from '@/lib/demo-data-smartbricks'
import { Sparkles, Target, Users, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react'

export default function SBDemoInsightsPage() {
  const stats = SB_DEMO_BUYER_STATS
  const leads = SB_DEMO_RECENT_LEADS
  const campaigns = SB_DEMO_TOP_CAMPAIGNS

  const avgScore = leads.length > 0
    ? (leads.reduce((sum, l) => sum + (l.ai_quality_score || 0), 0) / leads.length).toFixed(0)
    : '0'

  const qualifiedRate = stats.total_leads > 0
    ? Math.round(((stats.hot_leads + stats.qualified) / stats.total_leads) * 100)
    : 0

  const insights = [
    {
      title: 'Hot Lead Alert: Khalid Al-Maktoum',
      description: 'NB Score 95 — UHNW verified cash buyer with AED 25M+ portfolio. Wants Palm Residences penthouse. Contact immediately to close.',
      priority: 'high' as const,
    },
    {
      title: 'Fatima Al-Hashimi — Ready to Reserve',
      description: 'NB Score 91 — Local UAE buyer with AED 15M cash budget. Solicitor appointed. High conversion probability on Saadiyat Shores. Follow up today.',
      priority: 'high' as const,
    },
    {
      title: 'UK & European Pipeline Growing',
      description: '3 of 8 recent leads are UK/European investors (Oliver Hartley, Sophie Laurent, Thomas Schneider). Consider expanding Meta UK campaign for Canary Wharf Place launch.',
      priority: 'medium' as const,
    },
    {
      title: 'Creek Vista — Bayut Outperforming',
      description: 'Bayut Featured campaign delivering $143 CPL vs $257 for Google Premium. Consider reallocating 25% of Google budget to Bayut for Creek Vista.',
      priority: 'medium' as const,
    },
    {
      title: '198 Leads Awaiting Contact',
      description: `${stats.contact_pending} leads still in "Contact Pending" status. Prioritize high-score leads first — your top pending lead (Chen Wei, Score 79) is a Golden Visa buyer with $750K+ budget.`,
      priority: 'high' as const,
    },
    {
      title: 'JBR Waterfront — 85% Sold',
      description: 'Only 31 of 210 units remaining. Consider launching a "final units" campaign to drive urgency. International buyers showing highest interest.',
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
