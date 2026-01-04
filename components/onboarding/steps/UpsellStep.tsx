'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OnboardingFormData } from '@/lib/onboarding'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpsellStepProps {
  data: OnboardingFormData
  onComplete: (requestedCampaign: boolean) => void
  onBack: () => void
  isSaving: boolean
}

const benefits = [
  'Dedicated campaign manager',
  'Custom creative assets',
  'Weekly performance reports',
]

export default function UpsellStep({
  data,
  onComplete,
  onBack,
  isSaving,
}: UpsellStepProps) {
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleInterested = () => {
    setSelectedOption(true)
  }

  const handleMaybeLater = () => {
    setSelectedOption(false)
  }

  const handleGoToDashboard = () => {
    if (selectedOption === null) return

    setShowConfetti(true)
    setTimeout(() => {
      onComplete(selectedOption)
    }, 500)
  }

  const companyName = data.companyName || 'your company'

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-muted-foreground">
          One more thing...
        </p>
      </div>

      {/* Upsell Card */}
      <div
        className={cn(
          'relative rounded-lg border-2 p-6 transition-all duration-200',
          'bg-gradient-to-br from-amber-500/5 to-amber-600/10',
          'border-amber-500/30 hover:border-amber-500/50'
        )}
      >
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-amber-950 text-xs font-semibold">
            <Star className="w-3 h-3" />
            RECOMMENDED
          </span>
        </div>

        <div className="mt-2 space-y-4">
          <h3 className="font-semibold text-lg">
            Launch a bespoke campaign for {companyName}
          </h3>
          <p className="text-muted-foreground">
            Let our team create and manage a done-for-you lead generation
            campaign tailored to your developments.
          </p>

          <ul className="space-y-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant={selectedOption === true ? 'default' : 'outline'}
              onClick={handleInterested}
              className={cn(
                'flex-1',
                selectedOption === true && 'bg-primary'
              )}
            >
              {selectedOption === true && <Check className="w-4 h-4 mr-2" />}
              Yes, I&apos;m interested
            </Button>
            <Button
              variant={selectedOption === false ? 'secondary' : 'ghost'}
              onClick={handleMaybeLater}
              className="flex-1"
            >
              {selectedOption === false && <Check className="w-4 h-4 mr-2" />}
              Maybe later
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleGoToDashboard}
          disabled={selectedOption === null || isSaving}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up your dashboard...
            </>
          ) : (
            <>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Simple confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-ping"
                style={{
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
