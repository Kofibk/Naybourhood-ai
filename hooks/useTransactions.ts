'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type {
  BuyerTransaction,
  TransactionStage,
  FallThroughReason,
  StageHistoryEntry,
} from '@/types/transactions'

const TRANSACTION_COLUMNS =
  'id, buyer_id, development_id, company_id, current_stage, stage_history, fall_through_reason, fall_through_stage, created_at, updated_at'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const GC_TIME = 30 * 60 * 1000 // 30 minutes

// Resolve the authenticated user's company_id from user_profiles
async function resolveCompanyId(fallbackCompanyId?: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return fallbackCompanyId || null
  const supabase = createClient()
  if (!supabase) return fallbackCompanyId || null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fallbackCompanyId || null

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    return profile?.company_id || fallbackCompanyId || null
  } catch {
    return fallbackCompanyId || null
  }
}

async function fetchTransactionForBuyer(buyerId: string): Promise<BuyerTransaction | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('buyer_transactions')
    .select(TRANSACTION_COLUMNS)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })
    .range(0, 0)

  if (error) {
    // Table may not exist yet — return null gracefully
    if (
      error.code === '42P01' ||
      error.message?.includes('does not exist') ||
      error.message?.includes('relation')
    ) {
      console.warn('[useTransactions] Table not found, returning null')
      return null
    }
    console.error('[useTransactions] Fetch error:', error.message)
    return null
  }

  return data && data.length > 0 ? (data[0] as BuyerTransaction) : null
}

export function useTransaction(buyerId: string) {
  const queryClient = useQueryClient()

  const {
    data: transaction,
    isLoading,
    error,
  } = useQuery<BuyerTransaction | null, Error>({
    queryKey: ['transaction', buyerId],
    queryFn: () => fetchTransactionForBuyer(buyerId),
    enabled: !!buyerId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: false,
  })

  // Create a new transaction
  const createMutation = useMutation({
    mutationFn: async (params: {
      buyerId: string
      developmentId?: string
      companyId?: string
    }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      // Resolve company_id from authenticated user — critical for RLS
      const companyId = await resolveCompanyId(params.companyId)
      if (!companyId) {
        throw new Error('Could not determine company. Please ensure your profile has a company assigned.')
      }

      const now = new Date().toISOString()
      const initialHistory: StageHistoryEntry[] = [
        { stage: 'enquiry', timestamp: now, notes: 'Transaction created' },
      ]

      const { data, error } = await supabase
        .from('buyer_transactions')
        .insert({
          buyer_id: params.buyerId,
          development_id: params.developmentId || null,
          company_id: companyId,
          current_stage: 'enquiry',
          stage_history: initialHistory,
        })
        .select(TRANSACTION_COLUMNS)
        .single()

      if (error) throw error
      return data as BuyerTransaction
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['transaction', buyerId], data)
      queryClient.invalidateQueries({ queryKey: ['outcome-analytics'] })
      toast.success('Transaction tracking started')
    },
    onError: (error: Error) => {
      console.error('[useTransactions] Create error:', error)
      toast.error('Failed to create transaction', { description: error.message })
    },
  })

  // Advance stage
  const advanceStageMutation = useMutation({
    mutationFn: async (params: {
      transactionId: string
      newStage: TransactionStage
      notes?: string
      updatedBy?: string
    }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      // Get current transaction to append to history
      const { data: current, error: fetchError } = await supabase
        .from('buyer_transactions')
        .select('stage_history')
        .eq('id', params.transactionId)
        .single()

      if (fetchError) throw fetchError

      const history: StageHistoryEntry[] = Array.isArray(current.stage_history)
        ? current.stage_history
        : []

      const newEntry: StageHistoryEntry = {
        stage: params.newStage,
        timestamp: new Date().toISOString(),
        notes: params.notes,
        updated_by: params.updatedBy,
      }

      const { data, error } = await supabase
        .from('buyer_transactions')
        .update({
          current_stage: params.newStage,
          stage_history: [...history, newEntry],
        })
        .eq('id', params.transactionId)
        .select(TRANSACTION_COLUMNS)
        .single()

      if (error) throw error
      return data as BuyerTransaction
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['transaction', buyerId], data)
      queryClient.invalidateQueries({ queryKey: ['outcome-analytics'] })
      toast.success(`Stage updated to ${data.current_stage}`)
    },
    onError: (error: Error) => {
      console.error('[useTransactions] Advance error:', error)
      toast.error('Failed to update stage', { description: error.message })
    },
  })

  // Mark as fallen through
  const fallThroughMutation = useMutation({
    mutationFn: async (params: {
      transactionId: string
      reason: FallThroughReason
      notes?: string
      updatedBy?: string
    }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      // Get current transaction
      const { data: current, error: fetchError } = await supabase
        .from('buyer_transactions')
        .select('current_stage, stage_history')
        .eq('id', params.transactionId)
        .single()

      if (fetchError) throw fetchError

      const history: StageHistoryEntry[] = Array.isArray(current.stage_history)
        ? current.stage_history
        : []

      const newEntry: StageHistoryEntry = {
        stage: 'fallen_through',
        timestamp: new Date().toISOString(),
        notes: params.notes || `Reason: ${params.reason}`,
        updated_by: params.updatedBy,
      }

      const { data, error } = await supabase
        .from('buyer_transactions')
        .update({
          current_stage: 'fallen_through',
          fall_through_reason: params.reason,
          fall_through_stage: current.current_stage,
          stage_history: [...history, newEntry],
        })
        .eq('id', params.transactionId)
        .select(TRANSACTION_COLUMNS)
        .single()

      if (error) throw error
      return data as BuyerTransaction
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['transaction', buyerId], data)
      queryClient.invalidateQueries({ queryKey: ['outcome-analytics'] })
      toast.success('Transaction marked as fallen through')
    },
    onError: (error: Error) => {
      console.error('[useTransactions] Fall-through error:', error)
      toast.error('Failed to update transaction', { description: error.message })
    },
  })

  const createTransaction = async (developmentId?: string, companyId?: string) => {
    try {
      return await createMutation.mutateAsync({
        buyerId,
        developmentId,
        companyId,
      })
    } catch {
      return null
    }
  }

  const advanceStage = async (
    transactionId: string,
    newStage: TransactionStage,
    notes?: string,
    updatedBy?: string
  ) => {
    try {
      return await advanceStageMutation.mutateAsync({
        transactionId,
        newStage,
        notes,
        updatedBy,
      })
    } catch {
      return null
    }
  }

  const markFallThrough = async (
    transactionId: string,
    reason: FallThroughReason,
    notes?: string,
    updatedBy?: string
  ) => {
    try {
      return await fallThroughMutation.mutateAsync({
        transactionId,
        reason,
        notes,
        updatedBy,
      })
    } catch {
      return null
    }
  }

  return {
    transaction,
    isLoading,
    error: error?.message ?? null,
    isCreating: createMutation.isPending,
    isAdvancing: advanceStageMutation.isPending,
    isFallingThrough: fallThroughMutation.isPending,
    createTransaction,
    advanceStage,
    markFallThrough,
  }
}
