'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { getGreeting, getDateString } from '@/lib/utils'
import type { Buyer } from '@/types'
import {
  Users,
  Flame,
  Calendar,
  MessageSquare,
  Phone,
  Eye,
  Heart,
  Sparkles,
  TrendingUp,
  PoundSterling,
} from 'lucide-react'

interface UserDashboardProps {
  userType: 'developer' | 'agent' | 'broker'
  userName: string
  companyId?: string  // For future multi-tenant data filtering
}

const config = {
  developer: {
    title: 'Buyers',
    metricLabel: 'Active Buyers',
  },
  agent: {
    title: 'Leads',
    metricLabel: 'Active Leads',
  },
  broker: {
    title: 'Clients',
    metricLabel: 'Active Clients',
  },
}

// Demo data for investor pitches
const DEMO_LEADS: Buyer[] = [
  {
    id: 'demo-1',
    full_name: 'James Richardson',
    email: 'james.richardson@email.com',
    phone: '+44 7700 900123',
    budget: '£2.5M - £3.5M',
    budget_min: 2500000,
    budget_max: 3500000,
    timeline: 'Ready to buy',
    status: 'Viewing Booked',
    ai_quality_score: 94,
    ai_intent_score: 92,
    ai_classification: 'Hot',
    ai_next_action: 'Confirm viewing for The Bishops Avenue property',
    payment_method: 'Cash',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    last_contact: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
  },
  {
    id: 'demo-2',
    full_name: 'Sarah Chen',
    email: 'sarah.chen@luxurymail.com',
    phone: '+44 7700 900456',
    budget: '£4M - £6M',
    budget_min: 4000000,
    budget_max: 6000000,
    timeline: 'Within 3 months',
    status: 'Negotiating',
    ai_quality_score: 91,
    ai_intent_score: 88,
    ai_classification: 'Hot',
    ai_next_action: 'Follow up on offer - awaiting seller response',
    payment_method: 'Mortgage',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    last_contact: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'demo-3',
    full_name: 'Michael Okonkwo',
    email: 'm.okonkwo@corp.com',
    phone: '+44 7700 900789',
    budget: '£1.8M - £2.2M',
    budget_min: 1800000,
    budget_max: 2200000,
    timeline: 'Ready to buy',
    status: 'Follow Up',
    ai_quality_score: 87,
    ai_intent_score: 85,
    ai_classification: 'Hot',
    ai_next_action: 'Schedule second viewing - client very interested',
    payment_method: 'Cash',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    last_contact: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: 'demo-4',
    full_name: 'Emma Thompson',
    email: 'emma.t@gmail.com',
    phone: '+44 7700 900321',
    budget: '£3M - £4M',
    budget_min: 3000000,
    budget_max: 4000000,
    timeline: 'Within 6 months',
    status: 'Viewing Booked',
    ai_quality_score: 82,
    ai_intent_score: 78,
    ai_classification: 'Warm-Qualified',
    ai_next_action: 'Prepare property brochure for viewing',
    payment_method: 'Mortgage',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    last_contact: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: 'demo-5',
    full_name: 'David Patel',
    email: 'dpatel@business.co.uk',
    phone: '+44 7700 900654',
    budget: '£5M+',
    budget_min: 5000000,
    timeline: 'Exploring options',
    status: 'New',
    ai_quality_score: 76,
    ai_intent_score: 72,
    ai_classification: 'Warm-Engaged',
    ai_next_action: 'Initial discovery call to understand requirements',
    payment_method: 'Cash',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'demo-6',
    full_name: 'Alexandra Müller',
    email: 'alex.muller@invest.de',
    phone: '+44 7700 900987',
    budget: '£2M - £3M',
    budget_min: 2000000,
    budget_max: 3000000,
    timeline: 'Investment property',
    status: 'Qualified',
    ai_quality_score: 79,
    ai_intent_score: 81,
    ai_classification: 'Warm-Qualified',
    ai_next_action: 'Send investment property portfolio',
    payment_method: 'Cash',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    last_contact: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },
  {
    id: 'demo-7',
    full_name: 'Robert Williams',
    email: 'rwilliams@outlook.com',
    phone: '+44 7700 900147',
    budget: '£1.5M - £2M',
    budget_min: 1500000,
    budget_max: 2000000,
    timeline: 'Within 3 months',
    status: 'Contact Pending',
    ai_quality_score: 68,
    ai_intent_score: 65,
    ai_classification: 'Warm-Engaged',
    ai_next_action: 'Make initial contact - high potential',
    payment_method: 'Mortgage',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 'demo-8',
    full_name: 'Fatima Al-Hassan',
    email: 'fatima.ah@email.com',
    phone: '+44 7700 900258',
    budget: '£6M - £8M',
    budget_min: 6000000,
    budget_max: 8000000,
    timeline: 'Ready to buy',
    status: 'Reserved',
    ai_quality_score: 96,
    ai_intent_score: 95,
    ai_classification: 'Hot',
    ai_next_action: 'Coordinate with solicitors for exchange',
    payment_method: 'Cash',
    company: 'Million Pound Homes',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    last_contact: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
]

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export function UserDashboard({ userType, userName, companyId }: UserDashboardProps) {
  const router = useRouter()
  const { leads, isLoading } = useData()
  const typeConfig = config[userType]

  // Filter leads by companyId for multi-tenant data isolation
  // For Quick Access/test users (mph-company), use demo data for investor pitches
  const isDemo = companyId === 'mph-company'
  const myLeads = useMemo(() => {
    if (!companyId) return []
    // Demo mode - use demo data for investor pitches
    if (isDemo) {
      // If we have real leads, combine with demo; otherwise just use demo
      const realLeads = leads.filter(lead => lead.company === 'Million Pound Homes')
      return realLeads.length > 0 ? realLeads : DEMO_LEADS
    }
    return leads.filter(lead => lead.company_id === companyId)
  }, [leads, companyId, isDemo])

  const hotLeads = useMemo(() =>
    myLeads.filter((l) => {
      const score = l.ai_quality_score ?? l.quality_score
      return score !== null && score !== undefined && score >= 85
    }).slice(0, 3),
    [myLeads]
  )

  // Calculate real metrics from filtered data
  const viewingsCount = useMemo(() =>
    myLeads.filter(l => l.status === 'Viewing Booked').length,
    [myLeads]
  )

  // Get recent activity from filtered leads
  const recentActivity = useMemo(() => {
    return myLeads
      .filter(l => l.created_at || l.last_contact)
      .sort((a, b) => {
        const dateA = new Date(a.last_contact || a.created_at || 0)
        const dateB = new Date(b.last_contact || b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 3)
  }, [myLeads])

  // Show message if not assigned to a company
  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-sm text-muted-foreground">{getDateString()}</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your account is not linked to a company.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact an administrator to assign you to a company to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate pipeline value from budget ranges
  const pipelineValue = useMemo(() => {
    return myLeads.reduce((total, lead) => {
      // Use budget_min as the pipeline value, or parse from budget string
      if (lead.budget_min) return total + lead.budget_min
      if (lead.budget) {
        // Try to extract number from budget string like "£2.5M - £3.5M"
        const match = lead.budget.match(/£([\d.]+)M/i)
        if (match) return total + parseFloat(match[1]) * 1000000
      }
      return total
    }, 0)
  }, [myLeads])

  // Calculate conversion rate
  const conversionRate = useMemo(() => {
    const positiveStatuses = ['Reserved', 'Exchanged', 'Completed', 'Negotiating']
    const converted = myLeads.filter(l => positiveStatuses.includes(l.status || '')).length
    return myLeads.length > 0 ? Math.round((converted / myLeads.length) * 100) : 0
  }, [myLeads])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-sm text-muted-foreground">{getDateString()}</p>
          {isDemo && (
            <Badge variant="outline" className="mt-2 text-[10px] text-primary border-primary">
              Demo Mode - Investor Pitch
            </Badge>
          )}
        </div>
        {isDemo && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">£{(pipelineValue / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground">Pipeline Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-[10px]">
                +{isDemo ? 23 : 12}%
              </Badge>
            </div>
            <div className="text-2xl font-bold">{myLeads.length}</div>
            <div className="text-xs text-muted-foreground">
              {typeConfig.metricLabel}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <Badge variant="warning" className="text-[10px]">
                Priority
              </Badge>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              {myLeads.filter((l) => {
                const score = l.ai_quality_score ?? l.quality_score
                return score !== null && score !== undefined && score >= 85
              }).length}
            </div>
            <div className="text-xs text-muted-foreground">
              Hot {typeConfig.title}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-[10px]">
                This Week
              </Badge>
            </div>
            <div className="text-2xl font-bold text-blue-500">{viewingsCount}</div>
            <div className="text-xs text-muted-foreground">Viewings Booked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">{myLeads.filter(l => l.status === 'New').length}</div>
            <div className="text-xs text-muted-foreground">New {typeConfig.title}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <PoundSterling className="h-5 w-5 text-emerald-500" />
              <Badge variant="success" className="text-[10px]">
                {conversionRate}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              {myLeads.filter(l => ['Reserved', 'Exchanged', 'Completed'].includes(l.status || '')).length}
            </div>
            <div className="text-xs text-muted-foreground">Reserved/Sold</div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Leads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Priority {typeConfig.title}
            <Badge variant="destructive" className="text-[10px]">{hotLeads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hotLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No priority leads at this time.</p>
          ) : (
            hotLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/20 hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{lead.full_name}</p>
                      <Badge variant={lead.ai_classification === 'Hot' ? 'destructive' : 'warning'} className="text-[10px]">
                        {lead.ai_classification || 'Hot'}
                      </Badge>
                      {lead.status && (
                        <Badge variant="outline" className="text-[10px]">
                          {lead.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lead.budget} • {lead.timeline} • Score: {lead.ai_quality_score ?? lead.quality_score}
                    </p>
                    {lead.ai_next_action && (
                      <p className="text-xs text-primary mt-2 font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {lead.ai_next_action}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push(`/${userType}/buyers`)}
          >
            View All {typeConfig.title}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/${userType}/buyers`)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">View {typeConfig.title}</p>
              <p className="text-xs text-muted-foreground">
                Browse all {typeConfig.title.toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/${userType}/campaigns`)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Campaigns</p>
              <p className="text-xs text-muted-foreground">View active campaigns</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/${userType}/matches`)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">My Matches</p>
              <p className="text-xs text-muted-foreground">
                {myLeads.filter(l => l.status === 'Qualified').length} qualified {typeConfig.title.toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => router.push(`/${userType}/insights`)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">AI Insights</p>
              <p className="text-xs text-muted-foreground">Get recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            recentActivity.map((lead, i) => {
              const date = lead.last_contact || lead.created_at
              const timeAgo = date ? getTimeAgo(date) : 'Recently'
              const statusColor = lead.status === 'Viewing Booked' ? 'bg-warning' :
                lead.status === 'New' ? 'bg-success' : 'bg-blue-500'
              const statusText = lead.status === 'Viewing Booked' ? 'Viewing booked:' :
                lead.status === 'New' ? 'New lead:' : 'Updated:'

              return (
                <div key={lead.id || i} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                  <span className="text-muted-foreground">{statusText}</span>
                  <span className="font-medium">{lead.full_name || lead.first_name || 'Unknown'}</span>
                  <span className="text-muted-foreground ml-auto">{timeAgo}</span>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
