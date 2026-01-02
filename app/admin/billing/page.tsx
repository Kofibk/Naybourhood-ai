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
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Building2,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { Company, Invoice } from '@/types'

// Demo billing data - in production this would come from Stripe/database
const mockSubscriptions: Partial<Company>[] = [
  {
    id: '1',
    name: 'Berkeley Homes',
    subscription_status: 'active',
    subscription_tier: 'enterprise',
    subscription_price: 2499,
    billing_cycle: 'monthly',
    next_billing_date: '2024-07-01',
    total_leads: 245,
  },
  {
    id: '2',
    name: 'Barratt Developments',
    subscription_status: 'active',
    subscription_tier: 'growth',
    subscription_price: 999,
    billing_cycle: 'monthly',
    next_billing_date: '2024-07-15',
    total_leads: 128,
  },
  {
    id: '3',
    name: 'Taylor Wimpey',
    subscription_status: 'trialing',
    subscription_tier: 'growth',
    subscription_price: 999,
    billing_cycle: 'monthly',
    next_billing_date: '2024-06-30',
    total_leads: 45,
  },
  {
    id: '4',
    name: 'Persimmon Homes',
    subscription_status: 'past_due',
    subscription_tier: 'starter',
    subscription_price: 499,
    billing_cycle: 'monthly',
    next_billing_date: '2024-06-15',
    total_leads: 67,
  },
  {
    id: '5',
    name: 'Redrow',
    subscription_status: 'active',
    subscription_tier: 'growth',
    subscription_price: 9990,
    billing_cycle: 'annual',
    next_billing_date: '2025-01-01',
    total_leads: 189,
  },
  {
    id: '6',
    name: 'Bellway',
    subscription_status: 'cancelled',
    subscription_tier: 'starter',
    subscription_price: 0,
    billing_cycle: 'monthly',
    next_billing_date: undefined,
    total_leads: 23,
  },
]

const mockInvoices: Invoice[] = [
  { id: 'INV-2024-001', company_id: '1', company_name: 'Berkeley Homes', amount: 2499, status: 'paid', invoice_date: '2024-06-01', paid_date: '2024-06-01' },
  { id: 'INV-2024-002', company_id: '2', company_name: 'Barratt Developments', amount: 999, status: 'paid', invoice_date: '2024-06-15', paid_date: '2024-06-15' },
  { id: 'INV-2024-003', company_id: '3', company_name: 'Taylor Wimpey', amount: 0, status: 'pending', invoice_date: '2024-06-30', description: 'Trial ending' },
  { id: 'INV-2024-004', company_id: '4', company_name: 'Persimmon Homes', amount: 499, status: 'overdue', invoice_date: '2024-06-15', due_date: '2024-06-20' },
  { id: 'INV-2024-005', company_id: '1', company_name: 'Berkeley Homes', amount: 2499, status: 'paid', invoice_date: '2024-05-01', paid_date: '2024-05-01' },
  { id: 'INV-2024-006', company_id: '2', company_name: 'Barratt Developments', amount: 999, status: 'paid', invoice_date: '2024-05-15', paid_date: '2024-05-16' },
  { id: 'INV-2024-007', company_id: '5', company_name: 'Redrow', amount: 9990, status: 'paid', invoice_date: '2024-01-01', paid_date: '2024-01-01', description: 'Annual subscription' },
]

export default function BillingPage() {
  const { companies, isLoading } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all')

  // Merge real companies with mock subscription data
  const subscribedCompanies = useMemo(() => {
    // Use mock data for now - in production, merge with real company data
    return mockSubscriptions as Company[]
  }, [companies])

  // Calculate revenue metrics
  const metrics = useMemo(() => {
    const activeSubscriptions = subscribedCompanies.filter(
      c => c.subscription_status === 'active' || c.subscription_status === 'trialing'
    )

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = subscribedCompanies.reduce((sum, c) => {
      if (c.subscription_status !== 'active') return sum
      const monthly = c.billing_cycle === 'annual'
        ? (c.subscription_price || 0) / 12
        : (c.subscription_price || 0)
      return sum + monthly
    }, 0)

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12

    // Count by status
    const active = subscribedCompanies.filter(c => c.subscription_status === 'active').length
    const trialing = subscribedCompanies.filter(c => c.subscription_status === 'trialing').length
    const pastDue = subscribedCompanies.filter(c => c.subscription_status === 'past_due').length
    const cancelled = subscribedCompanies.filter(c => c.subscription_status === 'cancelled').length

    // Count by tier
    const enterprise = subscribedCompanies.filter(c => c.subscription_tier === 'enterprise' && c.subscription_status === 'active').length
    const growth = subscribedCompanies.filter(c => c.subscription_tier === 'growth' && c.subscription_status === 'active').length
    const starter = subscribedCompanies.filter(c => c.subscription_tier === 'starter' && c.subscription_status === 'active').length

    // Invoice stats
    const paidInvoices = mockInvoices.filter(i => i.status === 'paid')
    const overdueInvoices = mockInvoices.filter(i => i.status === 'overdue')
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0)
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amount, 0)

    return {
      mrr,
      arr,
      active,
      trialing,
      pastDue,
      cancelled,
      enterprise,
      growth,
      starter,
      totalRevenue,
      overdueAmount,
      totalCustomers: subscribedCompanies.length,
    }
  }, [subscribedCompanies])

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return subscribedCompanies.filter(company => {
      const matchesSearch = !searchQuery ||
        company.name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' ||
        company.subscription_status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [subscribedCompanies, searchQuery, statusFilter])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter(invoice => {
      const matchesSearch = !searchQuery ||
        invoice.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = invoiceStatusFilter === 'all' ||
        invoice.status === invoiceStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchQuery, invoiceStatusFilter])

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'trialing':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'past_due':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      default:
        return null
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
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="muted">None</Badge>
    }
  }

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-600">Enterprise</Badge>
      case 'growth':
        return <Badge variant="default" className="bg-blue-600">Growth</Badge>
      case 'starter':
        return <Badge variant="outline">Starter</Badge>
      default:
        return null
    }
  }

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="muted">{status}</Badge>
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
            Track paying customers, subscriptions, and invoice status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <CreditCard className="h-4 w-4 mr-2" />
            Stripe Dashboard
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
              <span className="text-xs text-success">+12% vs last month</span>
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
              +{metrics.trialing} trials
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">At Risk</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{metrics.pastDue}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.overdueAmount)} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-400">Enterprise</p>
                <p className="text-2xl font-bold">{metrics.enterprise}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Avg. £2,499/mo</p>
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
                <p className="text-xs text-muted-foreground">Avg. £999/mo</p>
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
                <p className="text-xs text-muted-foreground">Avg. £499/mo</p>
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
              <CardTitle>Subscribers</CardTitle>
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
                <option value="cancelled">Cancelled</option>
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
                  {getStatusIcon(company.subscription_status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{company.name}</p>
                      {getTierBadge(company.subscription_tier)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{company.total_leads || 0} leads</span>
                      {company.next_billing_date && (
                        <>
                          <span>·</span>
                          <span>Next billing: {company.next_billing_date}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-medium">
                      {company.subscription_price
                        ? formatCurrency(company.subscription_price)
                        : '—'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.billing_cycle === 'annual' ? '/year' : '/month'}
                    </p>
                  </div>
                  {getStatusBadge(company.subscription_status)}
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

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>All invoices across customers</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.id}</p>
                      {getInvoiceStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Building2 className="h-3 w-3" />
                      <span>{invoice.company_name}</span>
                      <span>·</span>
                      <Calendar className="h-3 w-3" />
                      <span>{invoice.invoice_date}</span>
                      {invoice.description && (
                        <>
                          <span>·</span>
                          <span>{invoice.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                    {invoice.paid_date && (
                      <p className="text-xs text-muted-foreground">
                        Paid {invoice.paid_date}
                      </p>
                    )}
                    {invoice.status === 'overdue' && invoice.due_date && (
                      <p className="text-xs text-destructive">
                        Due {invoice.due_date}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredInvoices.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No invoices match your filters
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
            <Button variant="outline" className="h-auto py-4 flex-col">
              <RefreshCw className="h-5 w-5 mb-2" />
              <span className="text-sm">Sync Stripe</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-sm">Create Invoice</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <AlertCircle className="h-5 w-5 mb-2" />
              <span className="text-sm">Send Reminders</span>
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
