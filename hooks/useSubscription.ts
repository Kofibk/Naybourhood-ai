'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/types/billing'

interface SubscriptionData {
  subscription: Subscription | null
  companyName: string | null
  stripeEnabled: boolean
}

async function fetchSubscription(): Promise<SubscriptionData> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { subscription: null, companyName: null, stripeEnabled: false }
  }

  // Get user's company
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return { subscription: null, companyName: null, stripeEnabled: false }
  }

  // Get company name
  const { data: company } = await supabase
    .from('companies')
    .select('name, subscription_tier, subscription_status')
    .eq('id', profile.company_id)
    .single()

  // Get subscription from subscriptions table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      'id, company_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_start, current_period_end, created_at'
    )
    .eq('company_id', profile.company_id)
    .limit(1)
    .single()

  // Check if Stripe is enabled
  let stripeEnabled = false
  try {
    const res = await fetch('/api/billing/check-stripe')
    const data = await res.json()
    stripeEnabled = data.enabled === true
  } catch {
    stripeEnabled = false
  }

  return {
    subscription: subscription || null,
    companyName: company?.name || null,
    stripeEnabled,
  }
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
