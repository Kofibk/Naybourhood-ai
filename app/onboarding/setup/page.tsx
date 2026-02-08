'use client'

import { SetupWizard } from '@/components/onboarding-setup/SetupWizard'
import { QueryProvider } from '@/contexts/QueryProvider'
import { Toaster } from 'sonner'

export default function OnboardingSetupPage() {
  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
      <SetupWizard />
    </QueryProvider>
  )
}
