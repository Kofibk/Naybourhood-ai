'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OnboardingFormData } from '@/lib/onboarding'
import { ArrowLeft, Loader2, Upload, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DetailsStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  onBack: () => void
  isSaving: boolean
  userEmail: string
}

export default function DetailsStep({
  data,
  onNext,
  onBack,
  isSaving,
  userEmail,
}: DetailsStepProps) {
  const [firstName, setFirstName] = useState(data.firstName)
  const [lastName, setLastName] = useState(data.lastName)
  const [phone, setPhone] = useState(data.phone)
  const [jobTitle, setJobTitle] = useState(data.jobTitle)
  const [avatarUrl, setAvatarUrl] = useState(data.avatarUrl)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!firstName.trim()) newErrors.firstName = 'First name is required'
    if (!lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!phone.trim()) newErrors.phone = 'Phone number is required'
    if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      onNext({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        avatarUrl,
      })
    }
  }

  const formatPhone = (value: string) => {
    // Simple phone formatting - remove non-digits and format
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 4) return digits
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Tell us about you
        </h1>
        <p className="text-muted-foreground">
          We&apos;ll use this to personalise your experience
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className={cn(
              'w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center',
              'bg-muted/50 cursor-pointer hover:bg-muted transition-colors',
              avatarUrl ? 'border-primary' : 'border-border'
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <button
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            title="Upload photo"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={userEmail}
            disabled
            className="bg-muted text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="0123 456 7890"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="jobTitle">
            Job Title / Role <span className="text-destructive">*</span>
          </Label>
          <Input
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Sales Director, Founder"
            className={errors.jobTitle ? 'border-destructive' : ''}
          />
          {errors.jobTitle && (
            <p className="text-sm text-destructive">{errors.jobTitle}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}
