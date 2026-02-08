'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanCard as PlanCardType } from '@/types/billing'

interface PlanCardProps {
  plan: PlanCardType
  stripeEnabled: boolean
  bookingUrl: string
  onSelect: (tier: string) => void
  isLoading?: boolean
  loadingTier?: string | null
}

export function PlanCard({
  plan,
  stripeEnabled,
  bookingUrl,
  onSelect,
  isLoading,
  loadingTier,
}: PlanCardProps) {
  const isEnterprise = plan.isEnterprise

  const handleClick = () => {
    if (isEnterprise) {
      window.open(bookingUrl, '_blank', 'noopener')
      return
    }

    if (!stripeEnabled) {
      window.open(bookingUrl, '_blank', 'noopener')
      return
    }

    onSelect(plan.tier)
  }

  const buttonLabel = isEnterprise
    ? 'Book a Demo'
    : stripeEnabled
      ? plan.cta
      : 'Contact Us'

  const isBusy = isLoading && loadingTier === plan.tier

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        plan.popular && 'border-[#34D399] ring-1 ring-[#34D399]'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#34D399] text-[#0A0A0A] text-xs font-semibold px-3 py-1 rounded-full">
          Most Popular
        </div>
      )}

      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <div className="mt-2">
          <span className="text-2xl font-bold text-white">{plan.price}</span>
          {!isEnterprise && (
            <span className="text-white/50 text-sm ml-1">/month</span>
          )}
        </div>
        <CardDescription className="mt-1">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#34D399]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full mt-2"
          variant={plan.popular ? 'success' : 'outline'}
          size="lg"
          onClick={handleClick}
          disabled={isBusy}
        >
          {isBusy ? 'Redirecting...' : buttonLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
