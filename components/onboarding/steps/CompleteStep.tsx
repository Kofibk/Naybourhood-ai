'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { OnboardingFormData, getDashboardPath, completeOnboarding } from '@/lib/onboarding'
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Loader2,
} from 'lucide-react'

interface CompleteStepProps {
  data: OnboardingFormData
}

export default function CompleteStep({ data }: CompleteStepProps) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const finalize = async () => {
      await completeOnboarding()
      setCompleted(true)
    }
    finalize()
  }, [])

  const handleGoToDashboard = () => {
    setIsRedirecting(true)
    const path = getDashboardPath(data.userType || 'developer')
    router.push(path)
  }

  const nextSteps = [
    {
      icon: Sparkles,
      title: 'AI scores your leads',
      description: 'Every lead gets a Naybourhood Score (0-100) with quality, intent, and confidence ratings.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: Users,
      title: 'Priority actions appear',
      description: 'Your dashboard shows which leads to contact first, with recommended next actions.',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: BarChart3,
      title: 'Track your pipeline',
      description: 'Watch leads move through your funnel from new lead to completion.',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="space-y-8 text-center">
      {/* Success icon */}
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
        <div className="relative w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
      </div>

      <div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          You&apos;re all set, {data.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Your account is live. Here&apos;s what happens next.
        </p>
      </div>

      {/* Next steps */}
      <div className="space-y-3 text-left">
        {nextSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl"
            >
              <div className={`w-10 h-10 ${step.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${step.color}`} />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-0.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <Button
        onClick={handleGoToDashboard}
        disabled={isRedirecting || !completed}
        size="lg"
        className="w-full"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading dashboard...
          </>
        ) : (
          <>
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
