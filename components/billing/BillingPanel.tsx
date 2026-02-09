'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSubscription } from '@/hooks/useSubscription'
import {
  CreditCard,
  Calendar,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { BOOKING_URL } from '@/types/billing'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    enterprise: 'Enterprise',
  }
  return labels[tier] || tier
}

function statusBadge(status: string) {
  const variants: Record<string, 'success' | 'destructive' | 'secondary' | 'warning'> = {
    active: 'success',
    trialing: 'secondary',
    past_due: 'destructive',
    cancelled: 'destructive',
  }
  return (
    <Badge variant={variants[status] || 'secondary'}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function BillingPanel() {
  const { data, isLoading } = useSubscription()
  const [isRedirecting, setIsRedirecting] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { subscription, companyName, stripeEnabled } = data || {}

  // Pre-launch mode: Stripe not configured
  if (!stripeEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
          <CardDescription>
            Manage your subscription and payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <AlertCircle className="h-10 w-10 mx-auto text-white/30" />
            <div>
              <p className="text-white/70 font-medium">
                Billing available soon.
              </p>
              <p className="text-white/50 text-sm mt-1">
                You are on a pilot plan. All features are available during
                the pilot period.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(BOOKING_URL, '_blank', 'noopener')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Contact Us
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Stripe configured but no subscription
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-white/70">No active subscription found.</p>
            <Button
              onClick={() => (window.location.href = '/select-plan')}
            >
              Choose a Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleManagePayment = async () => {
    setIsRedirecting(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Could not open billing portal')
      }
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setIsRedirecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            {companyName ? `Billing for ${companyName}` : 'Your subscription details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">
                Plan
              </p>
              <p className="text-lg font-semibold">
                {tierLabel(subscription.plan_tier)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">
                Status
              </p>
              {statusBadge(subscription.status)}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">
                Current period
              </p>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3.5 w-3.5 text-white/40" />
                {formatDate(subscription.current_period_start)} &ndash;{' '}
                {formatDate(subscription.current_period_end)}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-white/50 uppercase tracking-wide">
                Next billing date
              </p>
              <p className="text-sm">
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleManagePayment} disabled={isRedirecting}>
          {isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening portal...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Payment Method
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => (window.location.href = '/select-plan')}
        >
          Change Plan
        </Button>
      </div>
    </div>
  )
}
