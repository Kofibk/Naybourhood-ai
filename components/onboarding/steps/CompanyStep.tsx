'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  OnboardingFormData,
  Company,
  checkCompanyMatch,
} from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Building2, Loader2, Lightbulb } from 'lucide-react'
import CompanyConfirmModal from './CompanyConfirmModal'

interface CompanyStepProps {
  data: OnboardingFormData
  onBack: () => void
  onCompanyComplete: (companyId: string) => void
  isSaving: boolean
}

export default function CompanyStep({
  data,
  onBack,
  onCompanyComplete,
  isSaving,
}: CompanyStepProps) {
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
      const match = await checkCompanyMatch(companyName.trim())

      if (match) {
        setMatchedCompany(match)
        setShowConfirmModal(true)
      } else {
        await handleCreateNewCompany()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking company:', error)
      }
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErrors({ companyName: 'Not authenticated. Please try again.' })
        setIsLoading(false)
        return
      }

      // Update profile to join existing company
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          email: user.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          job_title: data.jobTitle || null,
          user_type: data.userType,
          job_role: data.jobRole || null,
          company_id: matchedCompany.id,
          is_company_admin: false,
          membership_status: 'pending_approval',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        setErrors({ companyName: 'Failed to join company. Please try again.' })
        setIsLoading(false)
        return
      }

      onCompanyComplete(matchedCompany.id)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error joining company:', error)
      }
      setErrors({ companyName: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewCompany = async () => {
    setIsLoading(true)
    setShowConfirmModal(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErrors({ companyName: 'Not authenticated. Please try again.' })
        setIsLoading(false)
        return
      }

      // Create new company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          website: website.trim()
            ? (website.startsWith('http') ? website : `https://${website}`)
            : null,
          tier: 'TRIAL',
          created_by: user.id,
        })
        .select('id')
        .single()

      if (companyError) {
        setErrors({ companyName: 'Failed to create company. Please try again.' })
        setIsLoading(false)
        return
      }

      // Update profile as company admin
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          email: user.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          job_title: data.jobTitle || null,
          user_type: data.userType,
          job_role: data.jobRole || null,
          company_id: newCompany.id,
          is_company_admin: true,
          permission_role: 'owner',
          membership_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        setErrors({ companyName: 'Failed to complete setup. Please try again.' })
        setIsLoading(false)
        return
      }

      onCompanyComplete(newCompany.id)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating company:', error)
      }
      setErrors({ companyName: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={isLoading || isSaving}
        className="p-0 h-auto"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

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

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Logo and address can be added later in settings</p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleNext}
          disabled={isLoading || isSaving}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>

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
