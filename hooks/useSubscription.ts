'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/types/billing'

interface SubscriptionData {
  subscription: Subscription | null
  companyName: string | null
  stripeEnabled: boolean
}

const EMPTY_RESULT: SubscriptionData = {
  subscription: null,
  companyName: null,
  stripeEnabled: false,
}

async function fetchSubscription(): Promise<SubscriptionData> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return EMPTY_RESULT
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      return EMPTY_RESULT
    }

    // Get company name
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, subscription_tier, subscription_status')
      .eq('id', profile.company_id)
      .single()

    if (companyError) {
      console.error('[useSubscription] Error fetching company:', companyError)
    }

    // Get subscription from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(
        'id, company_id, stripe_customer_id, stripe_subscription_id, plan_tier, status, current_period_start, current_period_end, created_at'
      )
      .eq('company_id', profile.company_id)
      .limit(1)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected when no subscription exists
      console.error('[useSubscription] Error fetching subscription:', subError)
    }

    // Check if Stripe is enabled
    let stripeEnabled = false
    try {
      const res = await fetch('/api/billing/check-stripe')
      const json = await res.json()
      stripeEnabled = json.enabled === true
    } catch {
      stripeEnabled = false
    }

    return {
      subscription: subscription || null,
      companyName: company?.name || null,
      stripeEnabled,
    }
  } catch (error) {
    console.error('[useSubscription] Unexpected error:', error)
    throw error
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
