'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  OnboardingFormData,
  defaultFormData,
  getUserProfile,
  createUserProfile,
  saveOnboardingProgress,
  saveTeamInvites,
  completeOnboarding,
  profileToFormData,
} from '@/lib/onboarding'

import WelcomeStep from './steps/WelcomeStep'
import DetailsStep from './steps/DetailsStep'
import CompanyStep from './steps/CompanyStep'
import TeamStep from './steps/TeamStep'
import GoalsStep from './steps/GoalsStep'
import UpsellStep from './steps/UpsellStep'
import StepIndicator from './StepIndicator'
import { Loader2 } from 'lucide-react'

const TOTAL_STEPS = 6

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>(defaultFormData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    setIsLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUserEmail(user.email || '')

    let profile = await getUserProfile()

    // If no profile exists, create one
    if (!profile) {
      profile = await createUserProfile()
    }

    if (profile?.onboarding_completed) {
      // Redirect based on user type
      const redirectPath = getRedirectPath(profile.user_type)
      router.push(redirectPath)
      return
    }

    if (profile) {
      setCurrentStep(profile.onboarding_step || 1)
      setFormData(profileToFormData(profile))
    }

    setIsLoading(false)
  }

  const getRedirectPath = (userType: string | null): string => {
    switch (userType) {
      case 'developer':
        return '/developer'
      case 'agent':
        return '/agent'
      case 'broker':
        return '/broker'
      default:
        return '/developer'
    }
  }

  const handleNext = async (stepData: Partial<OnboardingFormData>) => {
    setIsSaving(true)
    const newFormData = { ...formData, ...stepData }
    setFormData(newFormData)

    // Map form data to database columns based on current step
    let dbData: Record<string, unknown> = {}

    switch (currentStep) {
      case 1:
        dbData = { user_type: stepData.userType }
        break
      case 2:
        dbData = {
          first_name: stepData.firstName,
          last_name: stepData.lastName,
          phone: stepData.phone,
          job_title: stepData.jobTitle,
          avatar_url: stepData.avatarUrl,
        }
        break
      case 3:
        dbData = {
          company_name: stepData.companyName,
          company_logo_url: stepData.companyLogoUrl,
          website: stepData.website,
          linkedin: stepData.linkedin,
          instagram: stepData.instagram,
          business_address: stepData.businessAddress,
          regions_covered: stepData.regionsCovered,
        }
        break
      case 4:
        // Save team invites separately
        if (stepData.teamEmails && stepData.teamEmails.length > 0) {
          await saveTeamInvites(stepData.teamEmails)
        }
        break
      case 5:
        dbData = { goals: stepData.goals }
        break
    }

    await saveOnboardingProgress(currentStep + 1, dbData)

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }

    setIsSaving(false)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async (requestedCampaign: boolean) => {
    setIsSaving(true)

    // Save the upsell preference first (but NOT onboarding_completed yet)
    await saveOnboardingProgress(TOTAL_STEPS, {
      requested_bespoke_campaign: requestedCampaign,
    })

    console.log('[Onboarding] Completing with:', { companyName: formData.companyName, website: formData.website })

    // Create company and mark customer as completed
    const success = await completeOnboarding({
      companyName: formData.companyName,
      website: formData.website,
    })

    if (success) {
      // Only mark onboarding as completed AFTER company creation succeeds
      await saveOnboardingProgress(TOTAL_STEPS, {
        onboarding_completed: true,
      })
    } else {
      console.error('[Onboarding] Failed to complete onboarding - company may not have been created')
      setIsSaving(false)
      return // Don't redirect if failed
    }

    const redirectPath = getRedirectPath(formData.userType)
    router.push(redirectPath)
  }

  const renderStep = () => {
    const commonProps = {
      data: formData,
      onBack: handleBack,
      isSaving,
    }

    switch (currentStep) {
      case 1:
        return <WelcomeStep data={formData} onNext={handleNext} isSaving={isSaving} />
      case 2:
        return <DetailsStep {...commonProps} onNext={handleNext} userEmail={userEmail} />
      case 3:
        return <CompanyStep {...commonProps} onNext={handleNext} />
      case 4:
        return <TeamStep {...commonProps} onNext={handleNext} />
      case 5:
        return <GoalsStep {...commonProps} onNext={handleNext} />
      case 6:
        return <UpsellStep {...commonProps} onComplete={handleComplete} />
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
