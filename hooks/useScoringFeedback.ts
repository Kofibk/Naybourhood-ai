'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface RecordOutcomeParams {
  buyerId: string
  companyId?: string | null
  originalQualityScore?: number | null
  originalIntentScore?: number | null
  originalConfidence?: number | null
  actualOutcome: 'completion' | 'fallen_through'
  stageReached: string
}

async function recordScoringOutcome(params: RecordOutcomeParams): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
  const supabase = createClient()
  if (!supabase) throw new Error('Failed to create Supabase client')

  const { error } = await supabase
    .from('scoring_outcomes')
    .insert({
      buyer_id: params.buyerId,
      company_id: params.companyId || null,
      original_quality_score: params.originalQualityScore ?? null,
      original_intent_score: params.originalIntentScore ?? null,
      original_confidence: params.originalConfidence ?? null,
      actual_outcome: params.actualOutcome,
      stage_reached: params.stageReached,
    })

  if (error) throw error
}

export function useScoringFeedback() {
  const mutation = useMutation({
    mutationFn: recordScoringOutcome,
    onSuccess: () => {
      toast.success('Scoring outcome recorded')
    },
    onError: (error: Error) => {
      console.error('[useScoringFeedback] Error:', error)
      toast.error('Failed to record scoring outcome', { description: error.message })
    },
  })

  const recordOutcome = async (params: RecordOutcomeParams) => {
    try {
      await mutation.mutateAsync(params)
    } catch {
      // Error handled in onError
    }
  }

  return {
    recordOutcome,
    isRecording: mutation.isPending,
  }
}
