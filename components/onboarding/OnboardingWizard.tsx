'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  OnboardingFormData,
  defaultFormData,
  getUserProfile,
  createUserProfile,
  saveOnboardingProgress,
  profileToFormData,
  getDashboardPath,
} from '@/lib/onboarding'

import WelcomeStep from './steps/WelcomeStep'
import CompanyStep from './steps/CompanyStep'
import StepIndicator from './StepIndicator'
import { Loader2 } from 'lucide-react'

const TOTAL_STEPS = 2

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>(defaultFormData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const loadProgress = useCallback(async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        router.push('/login')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let profile = await getUserProfile()

      // If no profile exists, create one
      if (!profile) {
        profile = await createUserProfile()
      }

      if (profile?.onboarding_completed) {
        // Redirect based on user type
        const redirectPath = getDashboardPath(profile.user_type || 'developer')
        router.push(redirectPath)
        return
      }

      if (profile) {
        // Clamp step to new max of 2
        const step = Math.min(profile.onboarding_step || 1, TOTAL_STEPS)
        setCurrentStep(step)
        setFormData(profileToFormData(profile))
      }
    } catch (err) {
      console.error('[Onboarding] Error loading progress:', err)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const handleNext = async (stepData: Partial<OnboardingFormData>) => {
    setIsSaving(true)
    try {
      const newFormData = { ...formData, ...stepData }
      setFormData(newFormData)

      // Step 1: Save profile data (role, name, phone, job title)
      if (currentStep === 1) {
        await saveOnboardingProgress(2, {
          user_type: stepData.userType as string,
          first_name: stepData.firstName,
          last_name: stepData.lastName,
          phone: stepData.phone,
          job_title: stepData.jobTitle,
        })

        setCurrentStep(2)
      }
    } catch (err) {
      console.error('[Onboarding] Error saving progress:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            data={formData}
            onNext={handleNext}
            isSaving={isSaving}
          />
        )
      case 2:
        return (
          <CompanyStep
            data={formData}
            onBack={handleBack}
            isSaving={isSaving}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        <div className="mt-8 bg-card rounded-lg border border-border p-6 md:p-8 shadow-lg">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
