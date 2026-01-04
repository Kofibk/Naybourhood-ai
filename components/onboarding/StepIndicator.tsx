'use client'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            step === currentStep
              ? 'bg-primary scale-110'
              : step < currentStep
              ? 'bg-primary/50'
              : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}
