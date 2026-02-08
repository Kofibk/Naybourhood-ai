'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { PlanCard } from '@/components/billing/PlanCard'
import { PLAN_CARDS, BOOKING_URL } from '@/types/billing'
import { useStripeStatus } from '@/hooks/useStripeStatus'
import { useSetupWizard } from '@/hooks/useSetupWizard'
import { getDashboardPath } from '@/lib/onboarding'
import { QueryProvider } from '@/contexts/QueryProvider'
import { Toaster, toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function SelectPlanContent() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: stripeStatus, isLoading: checking } = useStripeStatus()
  const { userType } = useSetupWizard()
  const stripeEnabled = stripeStatus?.enabled ?? false
  const dashboardPath = getDashboardPath(userType)

  // Handle Stripe checkout success redirect
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('Payment successful! Welcome aboard.')
      router.push(dashboardPath)
    }
  }, [searchParams, router, dashboardPath])

  const handleSelect = async (tier: string) => {
    if (!stripeEnabled) {
      window.open(BOOKING_URL, '_blank', 'noopener')
      return
    }

    setLoadingTier(tier)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.mode === 'pre_launch') {
        window.open(BOOKING_URL, '_blank', 'noopener')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setLoadingTier(null)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center p-4 py-12">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Logo variant="light" size="lg" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Choose your plan
          </h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Select the plan that fits your business. You can upgrade or change
            at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_CARDS.map((plan) => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              stripeEnabled={stripeEnabled}
              bookingUrl={BOOKING_URL}
              onSelect={handleSelect}
              isLoading={!!loadingTier}
              loadingTier={loadingTier}
            />
          ))}
        </div>

        {!stripeEnabled && (
          <p className="text-center text-sm text-white/40">
            Payments are not yet active. Choose a plan to contact our team.
          </p>
        )}

        <div className="text-center">
          <button
            onClick={() => router.push(dashboardPath)}
            className="text-sm text-white/50 hover:text-white/80 underline underline-offset-4"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SelectPlanPage() {
  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
          </div>
        }
      >
        <SelectPlanContent />
      </Suspense>
    </QueryProvider>
  )
}
