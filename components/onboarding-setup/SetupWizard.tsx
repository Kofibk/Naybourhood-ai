'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  useOnboardingProgress,
  ONBOARDING_STEPS,
  type OnboardingStep,
} from '@/hooks/useOnboardingProgress'
import { getDashboardPath } from '@/lib/onboarding'
import { CompanyProfileStep } from './CompanyProfileStep'
import { ImportLeadsStep } from './ImportLeadsStep'
import { InviteTeamStep } from './InviteTeamStep'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const STEP_LABELS = ['Company Profile', 'Import Leads', 'Invite Team']

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [userRole, setUserRole] = useState<string>('developer')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const router = useRouter()
  const { completedSteps, completeStep, isSaving, isLoading } =
    useOnboardingProgress()

  const loadUserRole = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type) {
        setUserRole(profile.user_type)
      }
    } catch (error) {
      console.error('[SetupWizard] Error loading user role:', error)
    } finally {
      setIsInitialLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadUserRole()
  }, [loadUserRole])

  // Skip to first incomplete step on load
  useEffect(() => {
    if (!isLoading && completedSteps.size > 0) {
      const firstIncomplete = ONBOARDING_STEPS.findIndex(
        (s) => !completedSteps.has(s)
      )
      if (firstIncomplete === -1) {
        // All steps complete - redirect to dashboard
        router.push(getDashboardPath(userRole))
        return
      }
      setCurrentStep(firstIncomplete)
    }
  }, [isLoading, completedSteps, router, userRole])

  const handleStepComplete = async (step: OnboardingStep) => {
    try {
      await completeStep(step)

      const nextIndex = ONBOARDING_STEPS.indexOf(step) + 1
      if (nextIndex >= ONBOARDING_STEPS.length) {
        // All steps done - mark onboarding complete
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase
            .from('user_profiles')
            .update({
              onboarding_completed: true,
              onboarding_completed_at: new Date().toISOString(),
            })
            .eq('id', user.id)
        }

        toast.success('Setup complete!')
        router.push(getDashboardPath(userRole))
      } else {
        setCurrentStep(nextIndex)
      }
    } catch (error) {
      toast.error('Failed to save progress. Please try again.')
    }
  }

  const handleSkip = (step: OnboardingStep) => {
    handleStepComplete(step)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (isInitialLoading || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#34D399]" />
          <p className="text-white/60">Loading your progress...</p>
        </div>
      </div>
    )
  }

  const stepName = ONBOARDING_STEPS[currentStep]

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/50">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={
                  i <= currentStep ? 'text-[#34D399] font-medium' : ''
                }
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#34D399] rounded-full transition-all duration-500"
              style={{
                width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-white/40 text-center">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Step content */}
        <div className="bg-[#111111] border border-white/10 rounded-xl p-6 md:p-8 shadow-xl">
          {stepName === 'company_profile' && (
            <CompanyProfileStep
              onNext={() => handleStepComplete('company_profile')}
              onSkip={() => handleSkip('company_profile')}
              isSaving={isSaving}
            />
          )}
          {stepName === 'import_leads' && (
            <ImportLeadsStep
              onNext={() => handleStepComplete('import_leads')}
              onBack={handleBack}
              onSkip={() => handleSkip('import_leads')}
              isSaving={isSaving}
            />
          )}
          {stepName === 'invite_team' && (
            <InviteTeamStep
              onComplete={() => handleStepComplete('invite_team')}
              onBack={handleBack}
              onSkip={() => handleSkip('invite_team')}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  )
}
