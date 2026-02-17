'use client'

import { cn } from '@/lib/utils'
import { STEP_LABELS } from '@/lib/onboarding'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  onStepClick?: (step: number) => void
}

export default function StepIndicator({ currentStep, totalSteps, onStepClick }: StepIndicatorProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dots with labels */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isCompleted = step < currentStep
          const isCurrent = step === currentStep
          const canNavigate = isCompleted && onStepClick

          return (
            <button
              key={step}
              type="button"
              onClick={() => canNavigate && onStepClick(step)}
              disabled={!canNavigate}
              className={cn(
                'flex flex-col items-center gap-1.5 transition-all duration-300',
                canNavigate ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                  isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                  isCompleted && 'bg-primary/80 text-primary-foreground',
                  !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium hidden sm:block transition-colors',
                  isCurrent && 'text-primary',
                  isCompleted && 'text-muted-foreground',
                  !isCurrent && !isCompleted && 'text-muted-foreground/50'
                )}
              >
                {STEP_LABELS[step - 1]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
