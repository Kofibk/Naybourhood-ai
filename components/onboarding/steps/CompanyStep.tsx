'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  OnboardingFormData,
  Company,
  checkCompanyMatch,
  completeOnboardingWithExistingCompany,
  completeOnboardingWithNewCompany,
} from '@/lib/onboarding'
import { ArrowLeft, Building2, Loader2, Lightbulb } from 'lucide-react'
import CompanyConfirmModal from './CompanyConfirmModal'

interface CompanyStepProps {
  data: OnboardingFormData
  onBack: () => void
  isSaving: boolean
}

export default function CompanyStep({
  data,
  onBack,
  isSaving,
}: CompanyStepProps) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState(data.companyName)
  const [website, setWebsite] = useState(data.website)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [matchedCompany, setMatchedCompany] = useState<Company | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!companyName.trim() || companyName.trim().length < 2) {
      newErrors.companyName = 'Company name is required (min 2 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validate()) return

    setIsLoading(true)

    try {
      // Check for existing company match
      const match = await checkCompanyMatch(companyName.trim())

      if (match) {
        // Found a match - show confirmation modal
        setMatchedCompany(match)
        setShowConfirmModal(true)
      } else {
        // No match - create new company directly
        await handleCreateNewCompany()
      }
    } catch (error) {
      console.error('Error checking company:', error)
      setErrors({ companyName: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmExisting = async () => {
    if (!matchedCompany) return

    setIsLoading(true)
    setShowConfirmModal(false)

    try {
      const formData: OnboardingFormData = {
        ...data,
        companyName: matchedCompany.name,
        website: matchedCompany.website || website,
      }

      const redirectPath = await completeOnboardingWithExistingCompany(formData, matchedCompany.id)

      if (redirectPath) {
        router.push(redirectPath)
      } else {
        setErrors({ companyName: 'Failed to complete setup. Please try again.' })
      }
    } catch (error) {
      console.error('Error joining company:', error)
      setErrors({ companyName: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewCompany = async () => {
    setIsLoading(true)
    setShowConfirmModal(false)

    try {
      const formData: OnboardingFormData = {
        ...data,
        companyName: companyName.trim(),
        website: website.trim(),
      }

      const redirectPath = await completeOnboardingWithNewCompany(formData)

      if (redirectPath) {
        router.push(redirectPath)
      } else {
        setErrors({ companyName: 'Failed to complete setup. Please try again.' })
      }
    } catch (error) {
      console.error('Error creating company:', error)
      setErrors({ companyName: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isLoading || isSaving}
        className="p-0 h-auto"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Your Company
        </h1>
        <p className="text-muted-foreground">
          Enter your company name to get started
        </p>
      </div>

      {/* Company Name - SIMPLE INPUT, NO AUTOCOMPLETE */}
      <div className="space-y-2">
        <Label htmlFor="companyName">
          Company name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter your company name"
          className={errors.companyName ? 'border-destructive' : ''}
          disabled={isLoading}
        />
        {errors.companyName && (
          <p className="text-sm text-destructive">{errors.companyName}</p>
        )}
      </div>

      {/* Website (optional) */}
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
            https://
          </span>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="rounded-l-none"
            placeholder="yourcompany.com (optional)"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Logo and address can be added later in settings</p>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleNext}
          disabled={isLoading || isSaving}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            'Get Started'
          )}
        </Button>
      </div>

      {/* Company Confirmation Modal */}
      <CompanyConfirmModal
        isOpen={showConfirmModal}
        company={matchedCompany}
        onConfirm={handleConfirmExisting}
        onCreateNew={handleCreateNewCompany}
        onClose={() => setShowConfirmModal(false)}
        isLoading={isLoading}
      />
    </div>
  )
}
