import type { Metadata } from 'next'
import PricingPageContent from '@/components/pricing/PricingPageContent'

export const metadata: Metadata = {
  title: 'Pricing | Naybourhood \u2014 AI Buyer Intelligence for Property',
  description:
    'Transparent per-lead pricing for property developers, estate agents, and mortgage brokers. Scoring from \u00A31/lead. Start your free trial.',
  openGraph: {
    title: 'Pricing | Naybourhood \u2014 AI Buyer Intelligence for Property',
    description:
      'Transparent per-lead pricing for property developers, estate agents, and mortgage brokers. Scoring from \u00A31/lead. Start your free trial.',
    type: 'website',
  },
}

export default function PricingPage() {
  return <PricingPageContent />
}
