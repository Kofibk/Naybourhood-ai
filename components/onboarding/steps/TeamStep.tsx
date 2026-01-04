'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OnboardingFormData } from '@/lib/onboarding'
import { ArrowLeft, Loader2, Plus, Trash2, Users } from 'lucide-react'

interface TeamStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  onBack: () => void
  isSaving: boolean
}

const MAX_INVITES = 10

export default function TeamStep({
  data,
  onNext,
  onBack,
  isSaving,
}: TeamStepProps) {
  const [emails, setEmails] = useState<string[]>(
    data.teamEmails.length > 0 ? data.teamEmails : ['']
  )
  const [errors, setErrors] = useState<Record<number, string>>({})

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validate = () => {
    const newErrors: Record<number, string> = {}
    const validEmails = emails.filter((e) => e.trim())

    validEmails.forEach((email, index) => {
      if (!validateEmail(email.trim())) {
        newErrors[index] = 'Invalid email address'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    const validEmails = emails.filter((e) => e.trim())

    if (validEmails.length === 0) {
      // Skip validation if no emails
      onNext({ teamEmails: [] })
      return
    }

    if (validate()) {
      onNext({ teamEmails: validEmails.map((e) => e.trim()) })
    }
  }

  const handleSkip = () => {
    onNext({ teamEmails: [] })
  }

  const addEmail = () => {
    if (emails.length < MAX_INVITES) {
      setEmails([...emails, ''])
    }
  }

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index)
      setEmails(newEmails)

      // Clear error for removed index
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)

    // Clear error when typing
    if (errors[index]) {
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Invite Your Team
        </h1>
        <p className="text-muted-foreground">
          Add team members who need access
        </p>
      </div>

      <div className="space-y-3">
        {emails.map((email, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="colleague@company.com"
                className={errors[index] ? 'border-destructive' : ''}
              />
              {errors[index] && (
                <p className="text-sm text-destructive mt-1">{errors[index]}</p>
              )}
            </div>
            {emails.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEmail(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {emails.length < MAX_INVITES && (
          <Button
            variant="outline"
            onClick={addEmail}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add another
          </Button>
        )}

        <p className="text-sm text-muted-foreground text-center">
          They&apos;ll receive an email invitation to join your team
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip this step
          </button>
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
    </div>
  )
}
