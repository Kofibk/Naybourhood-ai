'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { KycCheck } from '@/types'

const KYC_SELECT_COLUMNS = 'id, buyer_id, check_type, status, checkboard_reference, result_data, initiated_by, created_at, completed_at'

async function fetchKycCheck(buyerId: string): Promise<KycCheck | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = createClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('kyc_checks')
      .select(KYC_SELECT_COLUMNS)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      // Table may not exist yet - return null gracefully
      console.warn('[useKycCheck] Fetch error:', error.message)
      return null
    }

    return data?.[0] ?? null
  } catch (err) {
    // Network error or table doesn't exist - return null gracefully
    console.warn('[useKycCheck] Exception:', err)
    return null
  }
}

export function useKycCheck(buyerId: string) {
  const queryClient = useQueryClient()

  const {
    data: kycCheck = null,
    isLoading,
    error,
  } = useQuery<KycCheck | null, Error>({
    queryKey: ['kyc-check', buyerId],
    queryFn: () => fetchKycCheck(buyerId),
    enabled: !!buyerId,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const initiateCheckMutation = useMutation({
    mutationFn: async ({ checkType }: { checkType: string }) => {
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, checkType }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || 'Failed to initiate verification')
      }

      return response.json()
    },
    onSuccess: (data) => {
      if (data.available === false) {
        toast.info('Verification service not yet configured')
        return
      }
      queryClient.invalidateQueries({ queryKey: ['kyc-check', buyerId] })
      toast.success('Verification initiated')
    },
    onError: (error: Error) => {
      toast.error('Failed to initiate verification', { description: error.message })
    },
  })

  const initiateCheck = async (checkType: string = 'both') => {
    try {
      await initiateCheckMutation.mutateAsync({ checkType })
    } catch {
      // Error already handled in onError
    }
  }

  return {
    kycCheck,
    isLoading,
    error: error?.message ?? null,
    initiateCheck,
    isInitiating: initiateCheckMutation.isPending,
  }
}
