'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'What counts as a lead?',
    a: 'Any buyer enquiry that enters the system, whether from forms, WhatsApp, portal feeds, CSV import, or API.',
  },
  {
    q: 'What happens if I go over my lead estimate?',
    a: 'Billing adjusts automatically. You\u2019re charged per actual lead at your volume tier rate.',
  },
  {
    q: 'Can I change plans mid-month?',
    a: 'Yes. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.',
  },
  {
    q: 'What\u2019s included in the free trial?',
    a: '14-day trial with Scoring + CRM. Up to 50 leads scored free. No credit card required.',
  },
  {
    q: 'Do you offer custom enterprise pricing?',
    a: 'Yes. For 5+ developments or 10,000+ leads/month, contact us for volume discounts.',
  },
]

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="divide-y divide-[#2E2E2E]">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex items-center justify-between w-full py-5 text-left group"
              >
                <span className="text-lg font-medium text-white group-hover:text-[#34D399] transition-colors pr-4">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-white/50 flex-shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all ${
                  isOpen ? 'max-h-40 pb-5' : 'max-h-0'
                }`}
              >
                <p className="text-white/60 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
