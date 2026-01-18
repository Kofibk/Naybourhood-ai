'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OnboardingFormData } from '@/lib/onboarding'
import { Building2, Home, Landmark, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  isSaving: boolean
}

const userTypes = [
  {
    id: 'developer' as const,
    title: 'Developer',
    description: 'I develop properties',
    icon: Building2,
  },
  {
    id: 'agent' as const,
    title: 'Agent',
    description: 'I sell properties',
    icon: Home,
  },
  {
    id: 'broker' as const,
    title: 'Broker',
    description: 'I provide finance',
    icon: Landmark,
  },
]

export default function WelcomeStep({ data, onNext, isSaving }: WelcomeStepProps) {
  const [selectedType, setSelectedType] = useState<'developer' | 'agent' | 'broker' | ''>(data.userType)
  const [firstName, setFirstName] = useState(data.firstName)
  const [lastName, setLastName] = useState(data.lastName)
  const [phone, setPhone] = useState(data.phone)
  const [jobTitle, setJobTitle] = useState(data.jobTitle)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatPhone = (value: string) => {
    // Remove non-digits, keep + at start if present
    const cleaned = value.replace(/[^\d+]/g, '')
    // Simple formatting for display
    if (cleaned.startsWith('+44')) {
      const rest = cleaned.slice(3)
      if (rest.length <= 4) return `+44 ${rest}`
      if (rest.length <= 7) return `+44 ${rest.slice(0, 4)} ${rest.slice(4)}`
      return `+44 ${rest.slice(0, 4)} ${rest.slice(4, 7)} ${rest.slice(7, 11)}`
    }
    if (cleaned.startsWith('0')) {
      if (cleaned.length <= 4) return cleaned
      if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`
    }
    return cleaned
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedType) newErrors.userType = 'Please select a role'
    if (!firstName.trim() || firstName.trim().length < 2) newErrors.firstName = 'First name is required (min 2 characters)'
    if (!lastName.trim() || lastName.trim().length < 2) newErrors.lastName = 'Last name is required (min 2 characters)'

    // UK phone validation
    const phoneDigits = phone.replace(/[^\d]/g, '')
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      newErrors.phone = 'Please enter a valid UK phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      onNext({
        userType: selectedType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Let&apos;s get you set up
        </h1>
        <p className="text-muted-foreground">
          This takes about 60 seconds
        </p>
      </div>

      {/* Role Selection */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          I am a...
        </legend>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Select your role">
          {userTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.id

            return (
              <button
                key={type.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  'flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
                  'hover:border-primary/50 hover:bg-primary/5',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="font-medium text-sm">{type.title}</span>
              </button>
            )
          })}
        </div>
        {errors.userType && (
          <p className="text-sm text-destructive" role="alert">{errors.userType}</p>
        )}
      </fieldset>

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First name <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-sm text-destructive" role="alert">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last name <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-sm text-destructive" role="alert">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Phone & Job Title */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="07700 900000"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm text-destructive" role="alert">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleContinue} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
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
