'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { STEP_LABELS } from '@/lib/onboarding'
import {
  RefreshCw,
  Users,
  TrendingDown,
  Clock,
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react'

interface OnboardingEvent {
  id: string
  user_id: string
  event_type: string
  step_number: number | null
  metadata: Record<string, unknown>
  created_at: string
}

interface FunnelStep {
  step: number
  label: string
  users: number
  dropOffRate: number
}

export default function OnboardingFunnelPage() {
  const [events, setEvents] = useState<OnboardingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('onboarding_events')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[OnboardingFunnel] Error fetching events:', error)
        }
      } else {
        setEvents(data || [])
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[OnboardingFunnel] Fetch error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const analytics = useMemo(() => {
    // Unique users who started onboarding
    const startedUsers = new Set(
      events.filter((e) => e.event_type === 'onboarding_started').map((e) => e.user_id)
    )

    // Unique users who completed onboarding
    const completedUsers = new Set(
      events.filter((e) => e.event_type === 'onboarding_completed').map((e) => e.user_id)
    )

    // Users who completed each step
    const stepCompletions: Record<number, Set<string>> = {}
    events
      .filter((e) => e.event_type === 'step_completed' && e.step_number !== null)
      .forEach((e) => {
        const step = e.step_number!
        if (!stepCompletions[step]) {
          stepCompletions[step] = new Set()
        }
        stepCompletions[step].add(e.user_id)
      })

    // Users who skipped each step
    const stepSkips: Record<number, Set<string>> = {}
    events
      .filter((e) => e.event_type === 'step_skipped' && e.step_number !== null)
      .forEach((e) => {
        const step = e.step_number!
        if (!stepSkips[step]) {
          stepSkips[step] = new Set()
        }
        stepSkips[step].add(e.user_id)
      })

    // Build funnel data
    const funnel: FunnelStep[] = []
    const totalSteps = STEP_LABELS.length
    let prevUsers = startedUsers.size

    for (let step = 1; step <= totalSteps; step++) {
      const completedCount = (stepCompletions[step]?.size || 0)
      const skippedCount = (stepSkips[step]?.size || 0)
      const usersAtStep = completedCount + skippedCount
      const dropOff = prevUsers > 0 ? Math.round(((prevUsers - usersAtStep) / prevUsers) * 100) : 0

      funnel.push({
        step,
        label: STEP_LABELS[step - 1] || `Step ${step}`,
        users: usersAtStep,
        dropOffRate: Math.max(0, dropOff),
      })

      if (usersAtStep > 0) {
        prevUsers = usersAtStep
      }
    }

    // Average time to complete
    const completionTimes: number[] = []
    completedUsers.forEach((userId) => {
      const startEvent = events.find(
        (e) => e.user_id === userId && e.event_type === 'onboarding_started'
      )
      const endEvent = events.find(
        (e) => e.user_id === userId && e.event_type === 'onboarding_completed'
      )
      if (startEvent && endEvent) {
        const diff = new Date(endEvent.created_at).getTime() - new Date(startEvent.created_at).getTime()
        completionTimes.push(diff)
      }
    })

    const avgCompletionMs = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0

    const avgCompletionMins = Math.round(avgCompletionMs / 60000)

    // CSV import stats
    const csvStarted = events.filter((e) => e.event_type === 'csv_import_started').length
    const csvCompleted = events.filter((e) => e.event_type === 'csv_import_completed').length
    const totalRowsImported = events
      .filter((e) => e.event_type === 'csv_import_completed')
      .reduce((sum, e) => sum + (Number(e.metadata?.row_count) || 0), 0)

    return {
      totalStarted: startedUsers.size,
      totalCompleted: completedUsers.size,
      completionRate: startedUsers.size > 0
        ? Math.round((completedUsers.size / startedUsers.size) * 100)
        : 0,
      avgCompletionMins,
      funnel,
      csvStarted,
      csvCompleted,
      totalRowsImported,
      totalInvitesSent: events.filter((e) => e.event_type === 'team_invite_sent').length,
      totalDevelopmentsAdded: events.filter((e) => e.event_type === 'development_added').length,
    }
  }, [events])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Onboarding Funnel</h2>
          <p className="text-sm text-muted-foreground">
            Track where users drop off in the onboarding flow
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{analytics.totalStarted}</div>
            <div className="text-xs text-muted-foreground">Users Started</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-500">{analytics.totalCompleted}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-amber-500" />
            </div>
            <div className={`text-2xl font-bold ${analytics.completionRate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {analytics.completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">Completion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {analytics.avgCompletionMins > 0 ? `${analytics.avgCompletionMins}m` : '--'}
            </div>
            <div className="text-xs text-muted-foreground">Avg Completion Time</div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Step-by-Step Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Started row */}
            <div className="flex items-center gap-3">
              <span className="text-xs w-32 text-muted-foreground font-medium">Started</span>
              <div className="flex-1">
                <div
                  className="h-8 rounded flex items-center justify-end pr-3 transition-all bg-blue-500"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs font-medium text-white">{analytics.totalStarted}</span>
                </div>
              </div>
              <span className="text-xs w-16 text-right text-muted-foreground">--</span>
            </div>

            {analytics.funnel.map((step, i) => {
              const maxVal = Math.max(analytics.totalStarted, 1)
              const widthPercent = Math.max((step.users / maxVal) * 100, 5)
              const color = step.dropOffRate > 40
                ? 'bg-red-500'
                : step.dropOffRate > 20
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'

              return (
                <div key={step.step} className="flex items-center gap-3">
                  <span className="text-xs w-32 text-muted-foreground">
                    Step {step.step}: {step.label}
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-8 rounded flex items-center justify-end pr-3 transition-all ${color}`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-xs font-medium text-white">{step.users}</span>
                    </div>
                  </div>
                  <span className={`text-xs w-16 text-right font-medium ${
                    step.dropOffRate > 40 ? 'text-red-500' :
                    step.dropOffRate > 20 ? 'text-amber-500' :
                    'text-emerald-500'
                  }`}>
                    {step.dropOffRate > 0 ? `-${step.dropOffRate}%` : '0%'}
                  </span>
                </div>
              )
            })}

            {/* Completed row */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <span className="text-xs w-32 text-muted-foreground font-medium">Completed</span>
              <div className="flex-1">
                <div
                  className="h-8 rounded flex items-center justify-end pr-3 transition-all bg-emerald-500"
                  style={{ width: `${Math.max((analytics.totalCompleted / Math.max(analytics.totalStarted, 1)) * 100, 5)}%` }}
                >
                  <span className="text-xs font-medium text-white">{analytics.totalCompleted}</span>
                </div>
              </div>
              <span className="text-xs w-16 text-right font-medium text-emerald-500">
                {analytics.completionRate}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold">{analytics.csvCompleted}</div>
            <div className="text-xs text-muted-foreground">CSV Imports Completed</div>
            {analytics.totalRowsImported > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {analytics.totalRowsImported.toLocaleString()} total rows
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold">{analytics.totalInvitesSent}</div>
            <div className="text-xs text-muted-foreground">Team Invites Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-lg font-bold">{analytics.totalDevelopmentsAdded}</div>
            <div className="text-xs text-muted-foreground">Developments Added</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
