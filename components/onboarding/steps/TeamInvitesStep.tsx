'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OnboardingFormData, TeamInviteData } from '@/lib/onboarding'
import { ArrowLeft, UserPlus, Plus, Trash2, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamInvitesStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  onBack: () => void
  isSaving: boolean
}

const emptyInvite: TeamInviteData = {
  email: '',
  role: 'sales',
}

const roles: { id: 'sales' | 'marketing' | 'viewer'; label: string; description: string }[] = [
  { id: 'sales', label: 'Sales', description: 'Can view and manage leads' },
  { id: 'marketing', label: 'Marketing', description: 'Can view analytics and campaigns' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

export default function TeamInvitesStep({
  data,
  onNext,
  onBack,
  isSaving,
}: TeamInvitesStepProps) {
  const [invites, setInvites] = useState<TeamInviteData[]>(
    data.teamInvites.length > 0 ? data.teamInvites : [{ ...emptyInvite }]
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateInvite = (index: number, field: keyof TeamInviteData, value: string) => {
    const updated = [...invites]
    updated[index] = { ...updated[index], [field]: value }
    setInvites(updated)
  }

  const addInvite = () => {
    setInvites([...invites, { ...emptyInvite }])
  }

  const removeInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(invites.filter((_, i) => i !== index))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const validInvites = invites.filter((inv) => inv.email.trim())

    validInvites.forEach((inv, i) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inv.email.trim())) {
        newErrors[`email_${i}`] = 'Please enter a valid email'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return

    const validInvites = invites.filter((inv) => inv.email.trim())
    onNext({ teamInvites: validInvites })
  }

  const handleSkip = () => {
    onNext({ teamInvites: [] })
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} disabled={isSaving} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Invite Your Team
        </h1>
        <p className="text-muted-foreground">
          Add team members to collaborate on your pipeline
        </p>
      </div>

      {/* Seat info */}
      {data.userType === 'developer' && (
        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-blue-300">
            Your plan includes <strong>2 seats</strong>. Additional seats can be added later.
          </p>
        </div>
      )}

      {/* Invites */}
      <div className="space-y-3">
        {invites.map((invite, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <Input
                value={invite.email}
                onChange={(e) => updateInvite(index, 'email', e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                className={errors[`email_${index}`] ? 'border-destructive' : ''}
              />
              {errors[`email_${index}`] && (
                <p className="text-sm text-destructive">{errors[`email_${index}`]}</p>
              )}
            </div>
            <div className="flex gap-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => updateInvite(index, 'role', role.id)}
                  title={role.description}
                  className={cn(
                    'px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors',
                    invite.role === role.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
            {invites.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeInvite(index)}
                className="text-destructive hover:text-destructive h-10 px-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addInvite} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add another
      </Button>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={handleSkip} disabled={isSaving}>
          Skip for now
        </Button>
        <Button onClick={handleContinue} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending invites...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}
