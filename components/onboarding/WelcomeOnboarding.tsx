'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  Building2,
  UserPlus,
  Plug,
  Check,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeOnboardingProps {
  companyId: string
  userName: string
  userType: 'developer' | 'agent' | 'broker'
}

export function WelcomeOnboarding({ companyId, userName, userType }: WelcomeOnboardingProps) {
  const router = useRouter()
  const basePath = `/${userType}`
  const [hasDevelopments, setHasDevelopments] = useState(false)
  const [hasBuyers, setHasBuyers] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!isSupabaseConfigured() || !companyId) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Check developments count
        const { count: devCount } = await supabase
          .from('developments')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)

        // Check buyers count
        const { count: buyerCount } = await supabase
          .from('buyers')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)

        setHasDevelopments((devCount ?? 0) > 0)
        setHasBuyers((buyerCount ?? 0) > 0)
      } catch (err) {
        console.error('Error checking setup status:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSetupStatus()
  }, [companyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-white/40">Loading...</div>
      </div>
    )
  }

  // If user has buyers, don't show onboarding
  if (hasBuyers) return null

  const steps = [
    {
      number: 1,
      title: 'Add Your First Development',
      description: 'Create a property development to start matching buyers.',
      href: `${basePath}/developments`,
      icon: Building2,
      complete: hasDevelopments,
      cta: hasDevelopments ? 'Completed' : 'Add Development',
    },
    {
      number: 2,
      title: 'Add Your First Buyer',
      description: 'Add a buyer manually or import from CSV.',
      href: `${basePath}/buyers/new`,
      icon: UserPlus,
      complete: hasBuyers,
      cta: 'Add Buyer',
    },
    {
      number: 3,
      title: 'Connect Lead Sources',
      description: 'Set up integrations to automatically import leads.',
      href: `${basePath}/settings`,
      icon: Plug,
      complete: false,
      cta: 'View Settings',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Welcome header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-[#34D399]/20 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-[#34D399]" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Welcome to Naybourhood{userName ? `, ${userName}` : ''}!
        </h1>
        <p className="text-white/50 max-w-md mx-auto">
          Let&apos;s get your platform set up in 3 steps. Each step brings you closer to AI-powered buyer intelligence.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((stepItem) => {
          const Icon = stepItem.icon
          return (
            <div
              key={stepItem.number}
              className={`bg-[#111111] border rounded-2xl p-5 transition-all ${
                stepItem.complete
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Step number / check */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    stepItem.complete
                      ? 'bg-emerald-500/20'
                      : 'bg-white/5'
                  }`}
                >
                  {stepItem.complete ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-white/50" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white/30">
                      Step {stepItem.number}
                    </span>
                    {stepItem.complete && (
                      <span className="text-xs text-emerald-400 font-medium">
                        Complete
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mt-0.5">{stepItem.title}</h3>
                  <p className="text-sm text-white/50 mt-0.5">{stepItem.description}</p>
                </div>

                {/* Action */}
                <Button
                  variant={stepItem.complete ? 'ghost' : 'default'}
                  size="sm"
                  onClick={() => router.push(stepItem.href)}
                  className={
                    stepItem.complete
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'bg-[#34D399] hover:bg-[#34D399]/80 text-black font-medium'
                  }
                >
                  {stepItem.complete ? (
                    <>
                      <Check className="w-4 h-4 mr-1" /> Done
                    </>
                  ) : (
                    <>
                      {stepItem.cta}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Skip option */}
      <div className="text-center">
        <button
          onClick={() => {
            // Set a flag so the onboarding doesn't show again this session
            sessionStorage.setItem('naybourhood_skip_onboarding', 'true')
            window.location.reload()
          }}
          className="text-sm text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
        >
          Skip setup and go to dashboard
        </button>
      </div>
    </div>
  )
}
