'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  PoundSterling,
  Calendar,
  Flame,
  BarChart3,
  Brain,
} from 'lucide-react'

// Demo insights for investor pitch
const DEMO_METRICS = {
  leadQuality: 8.4,
  totalLeads: 847,
  qualifiedRate: 32,
  responseRate: 78,
  avgDaysToConvert: 12,
  pipelineValue: 127.5,
  conversionRate: 18,
  hotLeads: 23,
}

const DEMO_INSIGHTS = [
  {
    title: 'High-Value Lead Alert',
    description: 'James Richardson (Score: 94) is ready to make an offer on The Bishops Avenue property. Immediate follow-up recommended.',
    priority: 'high' as const,
    action: 'Contact Now',
    icon: Flame,
    impact: '+£2.5M potential',
  },
  {
    title: 'Optimal Contact Time',
    description: 'Analysis shows 73% higher response rates when contacting leads between 10am-12pm. 5 hot leads are best contacted this morning.',
    priority: 'high' as const,
    action: 'View Schedule',
    icon: Calendar,
    impact: '+23% conversion',
  },
  {
    title: 'Pipeline Opportunity',
    description: 'Sarah Chen and Michael Okonkwo are both in negotiation stage. Combined pipeline value: £6.2M. Both showing strong buying signals.',
    priority: 'high' as const,
    action: 'Review Deals',
    icon: PoundSterling,
    impact: '£6.2M pipeline',
  },
  {
    title: 'Lead Scoring Update',
    description: 'AI has identified 8 leads with improved scores this week. Alexandra Müller moved from Warm to Hot after second viewing.',
    priority: 'medium' as const,
    action: 'View Changes',
    icon: TrendingUp,
    impact: '8 upgraded',
  },
  {
    title: 'Campaign Performance',
    description: 'Meta campaigns outperforming Google by 34% on CPL. Consider reallocating £5k budget from Google to Meta for Q1.',
    priority: 'medium' as const,
    action: 'Optimize',
    icon: BarChart3,
    impact: '-34% CPL',
  },
  {
    title: 'Follow-up Required',
    description: '3 leads have not been contacted in 48+ hours despite high scores. Risk of losing interest if not actioned today.',
    priority: 'medium' as const,
    action: 'Take Action',
    icon: AlertTriangle,
    impact: '3 at risk',
  },
]

const DEMO_WEEKLY_TRENDS = [
  { label: 'New Leads', value: 34, change: '+12%', positive: true },
  { label: 'Viewings Booked', value: 8, change: '+60%', positive: true },
  { label: 'Offers Made', value: 3, change: '+200%', positive: true },
  { label: 'Avg Response Time', value: '2.4h', change: '-18%', positive: true },
]

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display">AI Insights</h2>
            <p className="text-sm text-muted-foreground">Personalized recommendations powered by AI</p>
          </div>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          <Sparkles className="h-3 w-3 mr-1" />
          Live Analysis
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-primary" />
              <Badge variant="success" className="text-[10px]">Excellent</Badge>
            </div>
            <div className="text-2xl font-bold">{DEMO_METRICS.leadQuality}</div>
            <div className="text-xs text-muted-foreground">Lead Quality Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-[10px]">+12%</Badge>
            </div>
            <div className="text-2xl font-bold">{DEMO_METRICS.totalLeads}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <Badge variant="success" className="text-[10px]">Above avg</Badge>
            </div>
            <div className="text-2xl font-bold">{DEMO_METRICS.qualifiedRate}%</div>
            <div className="text-xs text-muted-foreground">Qualified Rate</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <Badge variant="destructive" className="text-[10px]">Priority</Badge>
            </div>
            <div className="text-2xl font-bold text-orange-500">{DEMO_METRICS.hotLeads}</div>
            <div className="text-xs text-muted-foreground">Hot Leads</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Value Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <PoundSterling className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                <p className="text-3xl font-bold text-primary">£{DEMO_METRICS.pipelineValue}M</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold">{DEMO_METRICS.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{DEMO_METRICS.avgDaysToConvert}</p>
                <p className="text-xs text-muted-foreground">Avg Days to Convert</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            This Week&apos;s Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DEMO_WEEKLY_TRENDS.map((trend, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">{trend.label}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">{trend.value}</p>
                  <Badge variant={trend.positive ? 'success' : 'destructive'} className="text-[10px]">
                    {trend.change}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Recommendations
            <Badge variant="outline" className="text-[10px]">{DEMO_INSIGHTS.length} actions</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DEMO_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:border-primary/50 ${
                insight.priority === 'high' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-muted/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                insight.priority === 'high' ? 'bg-orange-500/20' : 'bg-muted'
              }`}>
                <insight.icon className={`h-5 w-5 ${
                  insight.priority === 'high' ? 'text-orange-500' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <Badge
                    variant={insight.priority === 'high' ? 'destructive' : 'warning'}
                    className="text-[10px]"
                  >
                    {insight.priority}
                  </Badge>
                  {insight.impact && (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary">
                      {insight.impact}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
              <Button size="sm" variant={insight.priority === 'high' ? 'default' : 'outline'} className="shrink-0">
                {insight.action}
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
