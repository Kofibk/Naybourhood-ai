'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import {
  CreditCard,
  Download,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  Search,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react'

// Pricing configuration
const TIER_PRICES = {
  starter: 299,
  access: 499,
  growth: 899,
  enterprise: 2499,
}

export default function BillingPage() {
  const { companies, isLoading, refreshData } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Use real companies data for billing
  const subscribedCompanies = useMemo(() => {
    return companies.map(company => ({
      ...company,
      // Ensure subscription_price is calculated from tier
      subscription_price: TIER_PRICES[company.subscription_tier as keyof typeof TIER_PRICES] || 0,
    }))
  }, [companies])

  // Calculate revenue metrics from real data
  const metrics = useMemo(() => {
    const activeCompanies = subscribedCompanies.filter(
      c => c.subscription_status === 'active' || c.status === 'active'
    )

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeCompanies.reduce((sum, c) => {
      const price = TIER_PRICES[c.subscription_tier as keyof typeof TIER_PRICES] || 0
      return sum + price
    }, 0)

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12

    // Count by status
    const active = subscribedCompanies.filter(c =>
      c.subscription_status === 'active' || c.status === 'active'
    ).length
    const trialing = subscribedCompanies.filter(c =>
      c.subscription_status === 'trialing'
    ).length
    const pastDue = subscribedCompanies.filter(c =>
      c.subscription_status === 'past_due'
    ).length
    const cancelled = subscribedCompanies.filter(c =>
      c.subscription_status === 'cancelled' || c.status === 'inactive'
    ).length

    // Count by tier
    const enterprise = subscribedCompanies.filter(c =>
      c.subscription_tier === 'enterprise' && (c.subscription_status === 'active' || c.status === 'active')
    ).length
    const growth = subscribedCompanies.filter(c =>
      c.subscription_tier === 'growth' && (c.subscription_status === 'active' || c.status === 'active')
    ).length
    const access = subscribedCompanies.filter(c =>
      c.subscription_tier === 'access' && (c.subscription_status === 'active' || c.status === 'active')
    ).length
    const starter = subscribedCompanies.filter(c =>
      c.subscription_tier === 'starter' && (c.subscription_status === 'active' || c.status === 'active')
    ).length

    return {
      mrr,
      arr,
      active,
      trialing,
      pastDue,
      cancelled,
      enterprise,
      growth,
      access,
      starter,
      totalCustomers: subscribedCompanies.length,
    }
  }, [subscribedCompanies])

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return subscribedCompanies.filter(company => {
      const matchesSearch = !searchQuery ||
        company.name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' ||
        company.subscription_status === statusFilter ||
        (statusFilter === 'active' && company.status === 'active')

      return matchesSearch && matchesStatus
    })
  }, [subscribedCompanies, searchQuery, statusFilter])

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'trialing':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'cancelled':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      default:
        return <CheckCircle className="h-4 w-4 text-success" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'trialing':
        return <Badge variant="default" className="bg-blue-500">Trial</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      case 'cancelled':
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      default:
        return <Badge variant="success">Active</Badge>
    }
  }

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-600">Enterprise</Badge>
      case 'growth':
        return <Badge variant="default" className="bg-blue-600">Growth</Badge>
      case 'access':
        return <Badge variant="default" className="bg-teal-600">Access</Badge>
      case 'starter':
        return <Badge variant="outline">Starter</Badge>
      default:
        return <Badge variant="muted">Free</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Billing & Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            Track paying customers and subscription status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refreshData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">MRR</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xs text-success">Monthly recurring</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">ARR</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.arr)}</p>
            <p className="text-xs text-muted-foreground mt-1">Annual projection</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active Subscribers</span>
            </div>
            <p className="text-2xl font-bold">{metrics.active}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.trialing > 0 ? `+${metrics.trialing} trials` : 'Paying customers'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Companies</span>
            </div>
            <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.cancelled} inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Enterprise</p>
                <p className="text-2xl font-bold">{metrics.enterprise}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">£{TIER_PRICES.enterprise}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-400">Growth</p>
                <p className="text-2xl font-bold">{metrics.growth}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">£{TIER_PRICES.growth}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-500/20 bg-teal-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-400">Access</p>
                <p className="text-2xl font-bold">{metrics.access}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">£{TIER_PRICES.access}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Starter</p>
                <p className="text-2xl font-bold">{metrics.starter}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">£{TIER_PRICES.starter}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Companies</CardTitle>
              <CardDescription>{filteredCompanies.length} companies</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(company.subscription_status || company.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{company.name}</p>
                      {getTierBadge(company.subscription_tier)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{company.type}</span>
                      {company.contact_email && (
                        <>
                          <span>·</span>
                          <span>{company.contact_email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-medium">
                      {company.subscription_tier
                        ? formatCurrency(TIER_PRICES[company.subscription_tier as keyof typeof TIER_PRICES] || 0)
                        : '—'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                  {getStatusBadge(company.subscription_status || company.status)}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
            {filteredCompanies.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No companies match your filters
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => refreshData()}>
              <RefreshCw className="h-5 w-5 mb-2" />
              <span className="text-sm">Refresh Data</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <CreditCard className="h-5 w-5 mb-2" />
              <span className="text-sm">Stripe Dashboard</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-sm">Create Invoice</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Download className="h-5 w-5 mb-2" />
              <span className="text-sm">Export Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
