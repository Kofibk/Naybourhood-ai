'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  CheckCircle,
} from 'lucide-react'

const insights = [
  {
    title: 'Hot Lead Alert',
    description:
      'James Chen (Score: 94) has been inactive for 3 days. Recommend immediate follow-up.',
    type: 'action',
    priority: 'high',
  },
  {
    title: 'Budget Match',
    description:
      '3 new buyers match your £800K-1M price point. View matches to connect.',
    type: 'opportunity',
    priority: 'medium',
  },
  {
    title: 'Market Trend',
    description:
      'Buyer interest in South West London is up 15% this week. Consider increasing marketing.',
    type: 'insight',
    priority: 'low',
  },
  {
    title: 'Response Time',
    description:
      'Your average response time is 4.2 hours. Top performers respond within 1 hour.',
    type: 'improvement',
    priority: 'medium',
  },
]

const metrics = [
  { label: 'Lead Quality', value: '8.4', trend: '+0.3', icon: Target },
  { label: 'Response Rate', value: '92%', trend: '+5%', icon: Users },
  { label: 'Conversion', value: '34%', trend: '+2%', icon: TrendingUp },
]

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold font-display">AI Insights</h2>
          <p className="text-sm text-muted-foreground">
            Personalized recommendations powered by AI
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="success" className="text-[10px]">
                  {metric.trend}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <CheckCircle
                className={`h-5 w-5 mt-0.5 shrink-0 ${
                  insight.priority === 'high'
                    ? 'text-orange-500'
                    : insight.priority === 'medium'
                    ? 'text-yellow-500'
                    : 'text-success'
                }`}
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <Badge
                    variant={
                      insight.priority === 'high'
                        ? 'destructive'
                        : insight.priority === 'medium'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
