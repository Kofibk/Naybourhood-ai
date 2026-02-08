'use client'

import { useQuery } from '@tanstack/react-query'

interface StripeStatus {
  enabled: boolean
}

async function fetchStripeStatus(): Promise<StripeStatus> {
  try {
    const res = await fetch('/api/billing/check-stripe')
    const data = await res.json()
    return { enabled: data.enabled === true }
  } catch {
    return { enabled: false }
  }
}

export function useStripeStatus() {
  return useQuery({
    queryKey: ['stripe-status'],
    queryFn: fetchStripeStatus,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
