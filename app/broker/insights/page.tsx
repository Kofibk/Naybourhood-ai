'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, Users, Target, Lightbulb, CheckCircle } from 'lucide-react'

const insights = [
  { title: 'New Lead Alert', description: 'James Chen needs mortgage for £800K property. Pre-qualified buyer.', priority: 'high' },
  { title: 'Follow-up Reminder', description: 'Sarah Williams application is pending. Check for updates.', priority: 'medium' },
  { title: 'Market Rate', description: 'Current avg mortgage rate is 5.2%. Update client recommendations.', priority: 'low' },
]

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold font-display">AI Insights</h2>
          <p className="text-sm text-muted-foreground">Recommendations for your practice</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success">+10%</Badge>
            </div>
            <div className="text-2xl font-bold">85%</div>
            <div className="text-xs text-muted-foreground">Approval Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success">+5</Badge>
            </div>
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-muted-foreground">Active Cases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success">+12%</Badge>
            </div>
            <div className="text-2xl font-bold">£2.4M</div>
            <div className="text-xs text-muted-foreground">Total Pipeline</div>
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
          {insights.map((insight, i) => (
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
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
