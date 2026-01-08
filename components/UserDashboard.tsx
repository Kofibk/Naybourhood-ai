'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { getGreeting, getDateString, formatCurrency } from '@/lib/utils'
import {
  Users,
  Flame,
  Calendar,
  MessageSquare,
  Phone,
  Eye,
  Heart,
  Sparkles,
  PoundSterling,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
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
  const router = useRouter()
  const { leads, financeLeads, isLoading } = useData()
  const typeConfig = config[userType]
  const isBroker = userType === 'broker'

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

  // Finance leads for brokers
  const myFinanceLeads = useMemo(() => {
    if (!isBroker) return []
    if (!companyId) return []
    if (companyId === 'mph-company') return financeLeads
    return financeLeads.filter(lead => lead.company_id === companyId)
  }, [financeLeads, companyId, isBroker])

  // Finance lead stats for brokers
  const financeStats = useMemo(() => {
    if (!isBroker) return null
    const total = myFinanceLeads.length
    const contactPending = myFinanceLeads.filter(l => l.status === 'Contact Pending').length
    const followUp = myFinanceLeads.filter(l => l.status === 'Follow-up').length
    const awaitingDocs = myFinanceLeads.filter(l => l.status === 'Awaiting Documents').length
    const completed = myFinanceLeads.filter(l => l.status === 'Completed' || l.status === 'Approved').length
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, contactPending, followUp, awaitingDocs, completed, conversionRate }
  }, [myFinanceLeads, isBroker])

  // Priority finance leads for brokers (most urgent - contact pending + follow up)
  const priorityFinanceLeads = useMemo(() => {
    if (!isBroker) return []
    return myFinanceLeads
      .filter(l => l.status === 'Contact Pending' || l.status === 'Follow-up')
      .sort((a, b) => {
        // Sort by required_by_date (most urgent first)
        const dateA = a.required_by_date ? new Date(a.required_by_date).getTime() : Infinity
        const dateB = b.required_by_date ? new Date(b.required_by_date).getTime() : Infinity
        return dateA - dateB
      })
      .slice(0, 5)
  }, [myFinanceLeads, isBroker])

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

      {/* Finance Stats for Brokers */}
      {isBroker && financeStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 cursor-pointer hover:border-primary/50" onClick={() => router.push('/broker/finance-leads')}>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <PoundSterling className="h-3 w-3" /> Finance Leads
            </div>
            <div className="text-2xl font-bold">{financeStats.total}</div>
          </Card>
          <Card className="p-3 border-yellow-200 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500/30 cursor-pointer" onClick={() => router.push('/broker/finance-leads')}>
            <div className="text-xs text-yellow-600 flex items-center gap-1">
              <Phone className="h-3 w-3" /> Contact Pending
            </div>
            <div className="text-2xl font-bold text-yellow-600">{financeStats.contactPending}</div>
          </Card>
          <Card className="p-3 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 cursor-pointer" onClick={() => router.push('/broker/finance-leads')}>
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Follow-up
            </div>
            <div className="text-2xl font-bold text-blue-600">{financeStats.followUp}</div>
          </Card>
          <Card className="p-3 border-purple-200 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-500/30 cursor-pointer" onClick={() => router.push('/broker/finance-leads')}>
            <div className="text-xs text-purple-600 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Awaiting Docs
            </div>
            <div className="text-2xl font-bold text-purple-600">{financeStats.awaitingDocs}</div>
          </Card>
          <Card className="p-3 border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30 cursor-pointer" onClick={() => router.push('/broker/finance-leads')}>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Flame className="h-3 w-3" /> Completed
            </div>
            <div className="text-2xl font-bold text-green-600">{financeStats.completed}</div>
          </Card>
          <Card className="p-3 border-primary/50 bg-primary/5">
            <div className="text-xs text-primary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Conv. Rate
            </div>
            <div className="text-2xl font-bold text-primary">{financeStats.conversionRate}%</div>
          </Card>
        </div>
      )}

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (lead.phone) {
                      window.open(`tel:${lead.phone}`, '_self')
                    }
                  }}
                  title={lead.phone || 'No phone number'}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/${userType}/buyers/${lead.id}`)
                  }}
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push(`/${userType}/buyers`)}
          >
            View All {typeConfig.title}
          </Button>
        </CardContent>
      </Card>

      {/* Priority Finance Leads for Brokers */}
      {isBroker && priorityFinanceLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-primary" />
              Priority Finance Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityFinanceLeads.map((lead) => {
              const daysUntil = lead.required_by_date
                ? Math.ceil((new Date(lead.required_by_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null
              const isUrgent = daysUntil !== null && daysUntil <= 7
              const isOverdue = daysUntil !== null && daysUntil < 0

              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push(`/broker/finance-leads/${lead.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isOverdue ? 'bg-red-500/10' : isUrgent ? 'bg-yellow-500/10' : 'bg-primary/10'
                    }`}>
                      <PoundSterling className={`h-5 w-5 ${
                        isOverdue ? 'text-red-500' : isUrgent ? 'text-yellow-500' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{lead.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : 'N/A')}
                        {lead.finance_type && ` • ${lead.finance_type}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isOverdue ? 'destructive' : isUrgent ? 'warning' : 'muted'}
                      className="text-[10px]"
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntil!)}d overdue`
                        : daysUntil !== null
                          ? `${daysUntil}d left`
                          : lead.status
                      }
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (lead.phone) {
                          window.open(`tel:${lead.phone}`, '_self')
                        }
                      }}
                      title={lead.phone || 'No phone number'}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/broker/finance-leads/${lead.id}`)
                      }}
                      title="View details"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => router.push('/broker/finance-leads')}
            >
              View All Finance Leads
            </Button>
          </CardContent>
        </Card>
      )}

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
