// Billing & Subscription Types

export type PlanTier = 'starter' | 'growth' | 'enterprise'

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing'

export interface Subscription {
  id: string
  company_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_tier: PlanTier
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

export interface OnboardingProgressRow {
  id: string
  user_id: string
  step: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface PlanCard {
  tier: PlanTier
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  isEnterprise?: boolean
}

export const PLAN_CARDS: PlanCard[] = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 'Price TBC',
    description: 'Get started with lead scoring and basic CRM tools.',
    features: [
      'AI lead scoring',
      'Basic CRM',
      'Up to 100 leads/month',
      'Email support',
    ],
    cta: 'Get Started',
  },
  {
    tier: 'growth',
    name: 'Growth',
    price: 'Price TBC',
    description: 'Scale with campaigns, automation, and more leads.',
    features: [
      'Everything in Starter',
      'Campaign management',
      'Automation workflows',
      'Up to 500 leads/month',
      'Priority support',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'Tailored solutions for large teams and agencies.',
    features: [
      'Everything in Growth',
      'Unlimited leads',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Book a Demo',
    isEnterprise: true,
  },
]

export const BOOKING_URL = 'https://calendly.com/naybourhood/demo'
