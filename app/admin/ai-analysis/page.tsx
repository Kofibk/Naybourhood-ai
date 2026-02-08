'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useData } from '@/contexts/DataContext'
import { useLeads } from '@/hooks/useLeads'
import { AIAnalysis, AIDashboardInsights } from '@/types'
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Calendar,
  PoundSterling,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
} from 'lucide-react'

export default function AIAnalysisPage() {
  const { leads, isLoading: leadsLoading } = useLeads()
  const { campaigns, isLoading: contextLoading, refreshData } = useData()
  const dataLoading = leadsLoading || contextLoading
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [insights, setInsights] = useState<AIDashboardInsights | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)

  // Fetch full analysis
  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const [analysisRes, insightsRes] = await Promise.all([
        fetch('/api/ai/analysis'),
        fetch('/api/ai/dashboard-insights'),
      ])

      if (analysisRes.ok) {
        const data = await analysisRes.json()
        setAnalysis(data)
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json()
        setInsights(data)
      }

      setLastAnalyzed(new Date())
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    runAnalysis()
  }, [])

  // Calculate quick stats from local data
  const quickStats = useMemo(() => {
    const totalLeads = leads.length
    const hotLeads = leads.filter(l => (l.quality_score || 0) >= 80).length
    const coldLeads = leads.filter(l => (l.quality_score || 0) < 40).length
    const avgScore = totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.quality_score || 0), 0) / totalLeads)
      : 0
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || c.amount_spent || 0), 0)

    return { totalLeads, hotLeads, coldLeads, avgScore, activeCampaigns, totalSpend }
  }, [leads, campaigns])

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20'
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20'
    if (score >= 40) return 'bg-orange-500/10 border-orange-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Pipeline Analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Deep insights into your lead pipeline and campaign performance
          </p>
          {lastAnalyzed && (
            <p className="text-xs text-muted-foreground mt-1">
              Last analyzed: {lastAnalyzed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={dataLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
          <Button
            size="sm"
            onClick={runAnalysis}
            disabled={isAnalyzing}
          >
            <Zap className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Total Leads</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{quickStats.totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Hot Leads</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">{quickStats.hotLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Cold Leads</span>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">{quickStats.coldLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Avg Score</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{quickStats.avgScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Active Campaigns</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{quickStats.activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Total Spend</span>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">£{quickStats.totalSpend.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health */}
        <Card className={`border ${analysis ? getHealthBg(analysis.pipelineHealth.score) : ''}`}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pipeline Health
              </span>
              {analysis && (
                <span className={`text-2xl font-bold ${getHealthColor(analysis.pipelineHealth.score)}`}>
                  {analysis.pipelineHealth.score}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing && !analysis ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <Progress value={analysis.pipelineHealth.score} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {analysis.pipelineHealth.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click &ldquo;Run Analysis&rdquo; to generate insights</p>
            )}
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              30-Day Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing && !analysis ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : analysis ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-muted-foreground">Expected Viewings</div>
                  <div className="text-2xl font-bold text-blue-500">{analysis.predictions.viewings}</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-xs text-muted-foreground">Expected Reservations</div>
                  <div className="text-2xl font-bold text-green-500">{analysis.predictions.reservations}</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-xs text-muted-foreground">Pipeline Value</div>
                  <div className="text-xl font-bold text-purple-500">{analysis.predictions.pipelineValue}</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-muted-foreground">At-Risk Leads</div>
                  <div className="text-2xl font-bold text-red-500">{analysis.predictions.atRiskLeads}</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click &ldquo;Run Analysis&rdquo; to generate predictions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Source Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing && !analysis ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analysis && analysis.sourcePerformance.length > 0 ? (
            <div className="space-y-4">
              {analysis.sourcePerformance.map((source, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.source}</span>
                      <Badge variant={source.hotLeadPercent >= 30 ? 'success' : source.hotLeadPercent >= 15 ? 'warning' : 'destructive'}>
                        {source.hotLeadPercent}% Hot
                      </Badge>
                    </div>
                    <Progress value={source.hotLeadPercent} className="h-2 mt-2" />
                  </div>
                  <div className="text-sm text-muted-foreground max-w-xs">
                    {source.recommendation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {analysis ? 'No source data available' : 'Click Run Analysis to see source performance'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bottlenecks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Pipeline Bottlenecks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing && !analysis ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analysis && analysis.bottlenecks.length > 0 ? (
            <div className="space-y-3">
              {analysis.bottlenecks.map((bottleneck, i) => (
                <div key={i} className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{bottleneck.stage}</span>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-500">{bottleneck.currentRate}%</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-green-500">{bottleneck.benchmark}% benchmark</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{bottleneck.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {analysis ? 'No significant bottlenecks detected' : 'Click Run Analysis to identify bottlenecks'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAnalyzing && !analysis ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analysis && analysis.topRecommendations.length > 0 ? (
            <div className="space-y-3">
              {analysis.topRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm flex-1">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {analysis ? 'All systems running smoothly!' : 'Click Run Analysis to get recommendations'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Insights from API */}
      {insights && insights.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Real-time Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.insights.map((insight, i) => {
                const typeStyles = {
                  critical: 'bg-red-500/10 border-red-500/30 text-red-600',
                  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
                  positive: 'bg-green-500/10 border-green-500/30 text-green-600',
                  info: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
                }
                const Icon = {
                  critical: XCircle,
                  warning: AlertTriangle,
                  positive: CheckCircle,
                  info: Clock,
                }[insight.type]

                return (
                  <div key={i} className={`p-3 rounded-lg border ${typeStyles[insight.type]}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{insight.title}</div>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        {insight.action && (
                          <Button size="sm" variant="outline" className="mt-2 text-xs">
                            {insight.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
