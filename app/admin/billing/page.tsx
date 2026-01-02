'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_TIERS } from '@/lib/subscriptionTiers'
import { formatCurrency } from '@/lib/utils'
import { Check, CreditCard, Download, FileText } from 'lucide-react'

const invoices = [
  { id: 'INV-001', date: 'Jun 1, 2024', amount: 2249, status: 'Paid' },
  { id: 'INV-002', date: 'May 1, 2024', amount: 2249, status: 'Paid' },
  { id: 'INV-003', date: 'Apr 1, 2024', amount: 2249, status: 'Paid' },
]

export default function BillingPage() {
  const currentTier = SUBSCRIPTION_TIERS.growth

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the {currentTier.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{currentTier.priceDisplay}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentTier.contactsDisplay} · {currentTier.description}
              </p>
            </div>
            <Button>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tiers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.values(SUBSCRIPTION_TIERS).map((tier) => (
            <Card
              key={tier.id}
              className={tier.popular ? 'border-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tier.name}</CardTitle>
                  {tier.popular && (
                    <Badge variant="default">Popular</Badge>
                  )}
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{tier.priceDisplay}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check
                        className={`h-4 w-4 ${
                          feature.included ? 'text-success' : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={
                          feature.included ? '' : 'text-muted-foreground line-through'
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.id === currentTier.id ? 'outline' : 'default'}
                  className="w-full"
                  disabled={tier.id === currentTier.id}
                >
                  {tier.id === currentTier.id ? 'Current Plan' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Visa ending in 4242</div>
                <div className="text-sm text-muted-foreground">Expires 12/25</div>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Download past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{invoice.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(invoice.amount)}
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
