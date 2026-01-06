'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { getGreeting, getDateString } from '@/lib/utils'
import {
  Users,
  Flame,
  Calendar,
  MessageSquare,
  Phone,
  Eye,
  Heart,
  Sparkles,
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
  const { leads, isLoading } = useData()
  const typeConfig = config[userType]

  // Filter leads by companyId for multi-tenant data isolation
  // For Quick Access/test users (mph-company), show all leads for testing
  const myLeads = useMemo(() => {
    if (!companyId) return []
    // Test company ID - show all leads for testing
    if (companyId === 'mph-company') {
      return leads
    }
    return leads.filter(lead => lead.company_id === companyId)
  }, [leads, companyId])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">
          {getGreeting()}, {userName}
        </h2>
        <p className="text-sm text-muted-foreground">{getDateString()}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Badge variant="success" className="text-[10px]">
                +12%
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
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{viewingsCount}</div>
            <div className="text-xs text-muted-foreground">Viewings Booked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{myLeads.filter(l => l.status === 'New').length}</div>
            <div className="text-xs text-muted-foreground">New {typeConfig.title}</div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Leads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Priority {typeConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hotLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.budget} • {lead.timeline}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="muted" className="text-[10px]">
                  Q:{lead.ai_quality_score ?? lead.quality_score ?? '-'}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full mt-2">
            View All {typeConfig.title}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
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
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Conversations</p>
              <p className="text-xs text-muted-foreground">View all messages</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
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
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
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
