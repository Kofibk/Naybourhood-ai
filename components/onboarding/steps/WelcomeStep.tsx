'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
    id: 'developer',
    title: 'Property Developer',
    description: 'I develop and sell properties',
    icon: Building2,
  },
  {
    id: 'agent',
    title: 'Estate Agent',
    description: 'I sell properties for clients',
    icon: Home,
  },
  {
    id: 'broker',
    title: 'Mortgage Broker',
    description: 'I provide mortgages',
    icon: Landmark,
  },
]

export default function WelcomeStep({ data, onNext, isSaving }: WelcomeStepProps) {
  const [selectedType, setSelectedType] = useState(data.userType)

  const handleContinue = () => {
    if (selectedType) {
      onNext({ userType: selectedType })
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Welcome to Naybourhood
        </h1>
        <p className="text-muted-foreground">
          What best describes you?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {userTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id

          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                'flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200',
                'hover:border-primary/50 hover:bg-primary/5',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              )}
            >
              <div
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-1">{type.title}</h3>
              <p className="text-sm text-muted-foreground text-center">
                {type.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!selectedType || isSaving}
          size="lg"
        >
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
