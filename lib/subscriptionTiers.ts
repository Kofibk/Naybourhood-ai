export type SubscriptionTier = 'access' | 'growth' | 'enterprise'

export interface TierFeature {
  name: string
  included: boolean
  limit?: string
}

export interface SubscriptionTierConfig {
  id: SubscriptionTier
  name: string
  price: number
  priceDisplay: string
  description: string
  contacts: number | 'unlimited'
  contactsDisplay: string
  scoreRange: string
  campaignsLocked: boolean
  features: TierFeature[]
  stripePriceId?: string
  popular?: boolean
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  access: {
    id: 'access',
    name: 'Access',
    price: 999,
    priceDisplay: '£999',
    description: 'Essential access to qualified property buyers',
    contacts: 30,
    contactsDisplay: '30 contacts/month',
    scoreRange: '50-69',
    campaignsLocked: true,
    features: [
      { name: '30 buyer contacts per month', included: true },
      { name: 'Buyers scoring 50-69', included: true },
      { name: 'Basic buyer profiles', included: true },
      { name: 'Email support', included: true },
      { name: 'Campaign management', included: false },
      { name: 'Priority buyers (70+)', included: false },
      { name: 'First refusal access', included: false },
      { name: 'Dedicated account manager', included: false },
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ACCESS_PRICE_ID,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 2249,
    priceDisplay: '£2,249',
    description: 'Scale your buyer pipeline with premium features',
    contacts: 100,
    contactsDisplay: '100 contacts/month',
    scoreRange: '50+',
    campaignsLocked: false,
    popular: true,
    features: [
      { name: '100 buyer contacts per month', included: true },
      { name: 'All buyers scoring 50+', included: true },
      { name: 'Full buyer profiles & insights', included: true },
      { name: 'Priority email & chat support', included: true },
      { name: 'Campaign management', included: true },
      { name: 'AI recommendations', included: true },
      { name: 'First refusal access', included: false },
      { name: 'Dedicated account manager', included: false },
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 3999,
    priceDisplay: '£3,999',
    description: 'Unlimited access with first refusal on premium buyers',
    contacts: 'unlimited',
    contactsDisplay: 'Unlimited contacts',
    scoreRange: 'All + First Refusal 80+',
    campaignsLocked: false,
    features: [
      { name: 'Unlimited buyer contacts', included: true },
      { name: 'All buyers + First Refusal on 80+ score', included: true },
      { name: 'Complete buyer intelligence', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Advanced campaign management', included: true },
      { name: 'AI recommendations & automation', included: true },
      { name: 'First refusal on premium buyers', included: true },
      { name: 'Dedicated account manager', included: true },
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
  },
}

export const getTierByPriceId = (priceId: string): SubscriptionTierConfig | undefined => {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.stripePriceId === priceId)
}

export const canAccessBuyer = (tier: SubscriptionTier, buyerScore: number): boolean => {
  switch (tier) {
    case 'access':
      return buyerScore >= 50 && buyerScore <= 69
    case 'growth':
      return buyerScore >= 50
    case 'enterprise':
      return true
    default:
      return false
  }
}

export const hasFirstRefusal = (tier: SubscriptionTier, buyerScore: number): boolean => {
  return tier === 'enterprise' && buyerScore >= 80
}

export const canManageCampaigns = (tier: SubscriptionTier): boolean => {
  return tier === 'growth' || tier === 'enterprise'
}

export const getContactLimit = (tier: SubscriptionTier): number | null => {
  const config = SUBSCRIPTION_TIERS[tier]
  return config.contacts === 'unlimited' ? null : config.contacts
}
