'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { OnboardingProgressRow } from '@/types/billing'

const STEPS = ['company_profile', 'import_leads', 'invite_team'] as const
export type OnboardingStep = typeof STEPS[number]
export { STEPS as ONBOARDING_STEPS }

async function fetchProgress(): Promise<OnboardingProgressRow[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('id, user_id, step, completed, completed_at, created_at')
    .eq('user_id', user.id)

  if (error) {
    console.error('[onboarding] Error fetching progress:', error)
    return []
  }

  return data || []
}

async function markStepComplete(step: OnboardingStep): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('onboarding_progress')
    .upsert(
      {
        user_id: user.id,
        step,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,step' }
    )

  if (error) {
    console.error('[onboarding] Error marking step complete:', error)
    throw new Error('Failed to save progress')
  }
}

export function useOnboardingProgress() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: fetchProgress,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const completeMutation = useMutation({
    mutationFn: markStepComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] })
    },
    onError: (error) => {
      console.error('[onboarding] Mutation error:', error)
    },
  })

  const completedSteps = new Set(
    (query.data || []).filter((r) => r.completed).map((r) => r.step)
  )

  return {
    progress: query.data || [],
    isLoading: query.isLoading,
    completedSteps,
    completeStep: completeMutation.mutateAsync,
    isSaving: completeMutation.isPending,
  }
}
