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
  createDevelopment,
  sendTeamInvite,
  completeOnboardingWithExistingCompany,
  completeOnboardingWithNewCompany,
  TOTAL_ONBOARDING_STEPS,
} from '@/lib/onboarding'

import WelcomeStep from './steps/WelcomeStep'
import CompanyStep from './steps/CompanyStep'
import BusinessConfigStep from './steps/BusinessConfigStep'
import TeamInvitesStep from './steps/TeamInvitesStep'
import PipelineImportStep from './steps/PipelineImportStep'
import LeadSourcesStep from './steps/LeadSourcesStep'
import CompleteStep from './steps/CompleteStep'
import StepIndicator from './StepIndicator'
import { Loader2 } from 'lucide-react'

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingFormData>(defaultFormData)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
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

      if (!profile) {
        profile = await createUserProfile()
      }

      if (profile?.onboarding_completed) {
        const redirectPath = getDashboardPath(profile.user_type || 'developer')
        router.push(redirectPath)
        return
      }

      if (profile) {
        const step = Math.min(profile.onboarding_step || 1, TOTAL_ONBOARDING_STEPS)
        setCurrentStep(step)
        setFormData(profileToFormData(profile))

        if (profile.company_id) {
          setCompanyId(profile.company_id)
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Onboarding] Error loading progress:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  // Step 1: Welcome (profile info)
  const handleWelcomeNext = async (stepData: Partial<OnboardingFormData>) => {
    setIsSaving(true)
    try {
      const newFormData = { ...formData, ...stepData }
      setFormData(newFormData)

      await saveOnboardingProgress(2, {
        user_type: stepData.userType as string,
        first_name: stepData.firstName,
        last_name: stepData.lastName,
        phone: stepData.phone,
        job_title: stepData.jobTitle,
      })

      setCurrentStep(2)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Onboarding] Error saving step 1:', err)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Step 2: Company completed — sets companyId then moves to step 3
  const handleCompanyComplete = async (newCompanyId: string) => {
    setCompanyId(newCompanyId)
    await saveOnboardingProgress(3, {})
    setCurrentStep(3)
  }

  // Step 3: Business Config
  const handleBusinessConfigNext = async (stepData: Partial<OnboardingFormData>) => {
    setIsSaving(true)
    try {
      const newFormData = { ...formData, ...stepData }
      setFormData(newFormData)

      // Create developments if developer
      if (companyId && stepData.developments && stepData.developments.length > 0) {
        for (const dev of stepData.developments) {
          if (dev.name.trim()) {
            await createDevelopment(companyId, dev)
          }
        }
      }

      await saveOnboardingProgress(4, {})
      setCurrentStep(4)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Onboarding] Error saving step 3:', err)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Step 4: Team Invites
  const handleTeamInvitesNext = async (stepData: Partial<OnboardingFormData>) => {
    setIsSaving(true)
    try {
      const newFormData = { ...formData, ...stepData }
      setFormData(newFormData)

      // Send invites
      if (companyId && stepData.teamInvites && stepData.teamInvites.length > 0) {
        for (const invite of stepData.teamInvites) {
          if (invite.email.trim()) {
            await sendTeamInvite(companyId, invite)
          }
        }
      }

      await saveOnboardingProgress(5, {})
      setCurrentStep(5)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Onboarding] Error saving step 4:', err)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Step 5: Pipeline Import
  const handleImportNext = async () => {
    await saveOnboardingProgress(6, {})
    setCurrentStep(6)
  }

  // Step 6: Lead Sources
  const handleLeadSourcesNext = async () => {
    setCurrentStep(TOTAL_ONBOARDING_STEPS)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            data={formData}
            onNext={handleWelcomeNext}
            isSaving={isSaving}
          />
        )
      case 2:
        return (
          <CompanyStep
            data={formData}
            onBack={handleBack}
            onCompanyComplete={handleCompanyComplete}
            isSaving={isSaving}
          />
        )
      case 3:
        return (
          <BusinessConfigStep
            data={formData}
            onNext={handleBusinessConfigNext}
            onBack={handleBack}
            isSaving={isSaving}
          />
        )
      case 4:
        return (
          <TeamInvitesStep
            data={formData}
            onNext={handleTeamInvitesNext}
            onBack={handleBack}
            isSaving={isSaving}
          />
        )
      case 5:
        return (
          <PipelineImportStep
            data={formData}
            companyId={companyId}
            onNext={handleImportNext}
            onBack={handleBack}
            isSaving={isSaving}
          />
        )
      case 6:
        return formData.userType ? (
          <CompleteStep data={formData} />
        ) : (
          <LeadSourcesStep
            data={formData}
            companyId={companyId}
            onNext={handleLeadSourcesNext}
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
        <StepIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_ONBOARDING_STEPS}
          onStepClick={handleStepClick}
        />
        <div className="mt-8 bg-card rounded-lg border border-border p-6 md:p-8 shadow-lg">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
