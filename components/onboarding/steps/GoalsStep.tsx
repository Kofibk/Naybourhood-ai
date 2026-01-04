'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OnboardingFormData } from '@/lib/onboarding'
import {
  ArrowLeft,
  Check,
  Loader2,
  Megaphone,
  Target,
  CheckSquare,
  TrendingDown,
  BarChart3,
  Key,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalsStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  onBack: () => void
  isSaving: boolean
}

const goals = [
  {
    id: 'brand_awareness',
    title: 'Brand Awareness',
    description: 'Increase visibility',
    icon: Megaphone,
  },
  {
    id: 'find_buyers',
    title: 'Find Buyers',
    description: 'Generate qualified buyer leads',
    icon: Target,
  },
  {
    id: 'qualify_leads',
    title: 'Qualify Leads',
    description: 'Score and prioritise',
    icon: CheckSquare,
  },
  {
    id: 'reduce_fall_throughs',
    title: 'Reduce Fall-Throughs',
    description: 'Close more deals faster',
    icon: TrendingDown,
  },
  {
    id: 'campaign_analytics',
    title: 'Campaign Analytics',
    description: 'Track marketing ROI',
    icon: BarChart3,
  },
  {
    id: 'access_verified_buyers',
    title: 'Access Verified Buyers',
    description: 'Connect with pre-qualified',
    icon: Key,
  },
]

export default function GoalsStep({
  data,
  onNext,
  onBack,
  isSaving,
}: GoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals)
  const [error, setError] = useState('')

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalId))
    } else {
      setSelectedGoals([...selectedGoals, goalId])
    }
    setError('')
  }

  const handleContinue = () => {
    if (selectedGoals.length === 0) {
      setError('Please select at least one goal')
      return
    }
    onNext({ goals: selectedGoals })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          What are your goals?
        </h1>
        <p className="text-muted-foreground">
          Select all that apply
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon
          const isSelected = selectedGoals.includes(goal.id)

          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                'relative flex flex-col items-center p-5 rounded-lg border-2 transition-all duration-200',
                'hover:border-primary/50 hover:bg-primary/5',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{goal.title}</h3>
              <p className="text-xs text-muted-foreground text-center">
                {goal.description}
              </p>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

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
