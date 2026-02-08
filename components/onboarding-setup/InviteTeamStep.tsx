'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, Loader2, Users } from 'lucide-react'

interface TeamMember {
  email: string
  role: 'admin' | 'sales' | 'marketing' | 'viewer'
}

interface InviteTeamStepProps {
  onComplete: () => void
  onBack: () => void
  onSkip: () => void
  isSaving: boolean
}

export function InviteTeamStep({
  onComplete,
  onBack,
  onSkip,
  isSaving,
}: InviteTeamStepProps) {
  const [members, setMembers] = useState<TeamMember[]>([
    { email: '', role: 'sales' },
  ])

  const addMember = () => {
    if (members.length < 10) {
      setMembers([...members, { email: '', role: 'sales' }])
    }
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const updateEmail = (index: number, email: string) => {
    const updated = [...members]
    updated[index] = { ...updated[index], email }
    setMembers(updated)
  }

  const updateRole = (
    index: number,
    role: TeamMember['role']
  ) => {
    const updated = [...members]
    updated[index] = { ...updated[index], role }
    setMembers(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production this would send invites via the existing invite system.
    // For onboarding flow, we mark the step complete.
    onComplete()
  }

  const hasValidEmails = members.some(
    (m) => m.email.trim() !== '' && m.email.includes('@')
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Invite Your Team</h2>
        <p className="text-white/60 text-sm mt-1">
          Add team members to collaborate on leads and campaigns.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {members.map((member, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              {index === 0 && <Label>Email</Label>}
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={member.email}
                onChange={(e) => updateEmail(index, e.target.value)}
              />
            </div>
            <div className="w-32 space-y-1">
              {index === 0 && <Label>Role</Label>}
              <Select
                value={member.role}
                onValueChange={(v) =>
                  updateRole(index, v as TeamMember['role'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {members.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeMember(index)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}

        {members.length < 10 && (
          <button
            type="button"
            onClick={addMember}
            className="flex items-center gap-1 text-sm text-[#34D399] hover:text-[#34D399]/80"
          >
            <Plus className="h-4 w-4" />
            Add another
          </button>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-white/50 hover:text-white/80 underline underline-offset-4"
            >
              Skip this step
            </button>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finishing...
              </>
            ) : hasValidEmails ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Send Invites & Finish
              </>
            ) : (
              'Finish Setup'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
