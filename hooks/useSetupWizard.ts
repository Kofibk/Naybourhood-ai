'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface UserRoleData {
  userType: string
  isAuthenticated: boolean
}

async function fetchUserRole(): Promise<UserRoleData> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { userType: 'developer', isAuthenticated: false }
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[useSetupWizard] Error fetching user role:', profileError)
    }

    return {
      userType: profile?.user_type || 'developer',
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('[useSetupWizard] Unexpected error:', error)
    throw error
  }
}

async function completeOnboarding(): Promise<void> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      throw new Error('Failed to complete onboarding')
    }
  } catch (error) {
    console.error('[useSetupWizard] Error completing onboarding:', error)
    throw error
  }
}

export function useSetupWizard() {
  const queryClient = useQueryClient()

  const roleQuery = useQuery({
    queryKey: ['setup-wizard-role'],
    queryFn: fetchUserRole,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-wizard-role'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete onboarding')
    },
  })

  return {
    userType: roleQuery.data?.userType || 'developer',
    isAuthenticated: roleQuery.data?.isAuthenticated ?? false,
    isLoading: roleQuery.isLoading,
    markOnboardingComplete: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
  }
}
