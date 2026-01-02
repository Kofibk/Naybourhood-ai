'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  PoundSterling,
  BarChart3,
} from 'lucide-react'

const monthlyData = [
  { month: 'Jan', leads: 145, spend: 32000, cpl: 48 },
  { month: 'Feb', leads: 178, spend: 35000, cpl: 45 },
  { month: 'Mar', leads: 234, spend: 42000, cpl: 42 },
  { month: 'Apr', leads: 189, spend: 38000, cpl: 47 },
  { month: 'May', leads: 267, spend: 48000, cpl: 41 },
  { month: 'Jun', leads: 312, spend: 52000, cpl: 38 },
]

export default function AnalyticsPage() {
  const { leads, campaigns } = useData()

  const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0)
  const totalLeads = leads.length
  const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Performance metrics and insights
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-[10px]">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <PoundSterling className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-[10px]">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <div className="text-xs text-muted-foreground">Total Spend</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-[10px]">
                <TrendingDown className="h-3 w-3 mr-1" />
                -15%
              </Badge>
            </div>
            <div className="text-2xl font-bold">£{avgCPL}</div>
            <div className="text-xs text-muted-foreground">Avg CPL</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-[10px]">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5%
              </Badge>
            </div>
            <div className="text-2xl font-bold">68%</div>
            <div className="text-xs text-muted-foreground">Conversion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    Month
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                    Leads
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                    Spend
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                    CPL
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, i) => {
                  const prevCPL = i > 0 ? monthlyData[i - 1].cpl : row.cpl
                  const trend = row.cpl < prevCPL ? 'down' : row.cpl > prevCPL ? 'up' : 'same'
                  return (
                    <tr
                      key={row.month}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <td className="p-3 font-medium">{row.month}</td>
                      <td className="p-3 text-right">{row.leads}</td>
                      <td className="p-3 text-right">{formatCurrency(row.spend)}</td>
                      <td className="p-3 text-right">£{row.cpl}</td>
                      <td className="p-3 text-right">
                        {trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-success ml-auto" />
                        ) : trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-destructive ml-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.slice(0, 5).map((campaign) => {
              const efficiency = campaign.cpl
                ? campaign.cpl < 45
                  ? 'high'
                  : campaign.cpl < 55
                  ? 'medium'
                  : 'low'
                : 'medium'
              return (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {campaign.client}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{campaign.leads} leads</div>
                      <div className="text-sm text-muted-foreground">
                        £{campaign.cpl} CPL
                      </div>
                    </div>
                    <Badge
                      variant={
                        efficiency === 'high'
                          ? 'success'
                          : efficiency === 'medium'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {efficiency === 'high'
                        ? 'High Efficiency'
                        : efficiency === 'medium'
                        ? 'Average'
                        : 'Needs Review'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
