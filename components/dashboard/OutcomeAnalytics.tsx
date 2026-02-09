'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOutcomeAnalytics } from '@/hooks/useOutcomeAnalytics'
import { BarChart3, TrendingDown, Clock, AlertTriangle } from 'lucide-react'

export function OutcomeAnalytics() {
  const { analytics, isLoading } = useOutcomeAnalytics()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/4" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasData = analytics.totalTransactions > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Transaction Outcomes</h3>
        <Badge variant="secondary">{analytics.totalTransactions} transactions</Badge>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No transaction data yet. Start tracking buyer transactions to see outcome analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KPI Cards */}
          <div className="md:col-span-2 grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-green-500">
                  {analytics.completionRate}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Fall-Through Rate</div>
                <div className="text-2xl font-bold text-red-500">
                  {analytics.fallThroughRate}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Total Tracked</div>
                <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.funnel.map((stage, i) => {
                const maxValue = analytics.funnel[0]?.count || 1
                const widthPercent = Math.max((stage.count / maxValue) * 100, 15)
                const prevValue = i > 0 ? analytics.funnel[i - 1].count : stage.count
                const rate = prevValue > 0 ? Math.round((stage.count / prevValue) * 100) : 100

                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-xs w-20 text-muted-foreground truncate">
                      {stage.stage}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-7 rounded flex items-center justify-end pr-2 transition-all"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: stage.color,
                        }}
                      >
                        <span className="text-xs font-medium text-white">{stage.count}</span>
                      </div>
                    </div>
                    {i > 0 && (
                      <span
                        className={`text-xs w-10 text-right ${
                          rate >= 50 ? 'text-green-500' : 'text-amber-500'
                        }`}
                      >
                        {rate}%
                      </span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Fall-Through by Stage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Fall-Through Rate by Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.fallThroughByStage
                .filter((s) => s.count > 0 || s.rate > 0)
                .map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">{stage.count} dropped</span>
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div
                          className="h-2 bg-red-500 rounded-full transition-all"
                          style={{ width: `${Math.min(stage.rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 text-right text-red-400">
                        {stage.rate}%
                      </span>
                    </div>
                  </div>
                ))}
              {analytics.fallThroughByStage.every((s) => s.count === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No fall-throughs recorded yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Average Days per Stage */}
          {analytics.avgDaysPerStage.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Average Days per Stage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.avgDaysPerStage.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-medium">
                      {stage.avg_days > 0 ? `${stage.avg_days} days` : '-'}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top Fall-Through Reasons */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Fall-Through Reasons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.topFallThroughReasons.length > 0 ? (
                analytics.topFallThroughReasons.map((reason) => (
                  <div key={reason.reason} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{reason.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{reason.count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {reason.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No fall-throughs recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
