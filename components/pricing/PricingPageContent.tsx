'use client'

import Link from 'next/link'
import { Logo, LogoIcon } from '@/components/Logo'
import { ArrowRight } from 'lucide-react'
import PricingCalculator from './PricingCalculator'
import PricingFAQ from './PricingFAQ'

export default function PricingPageContent() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── Navigation ── */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <nav className="flex items-center justify-between">
            <Link href="/">
              <Logo variant="light" size="md" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/#product"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Product
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-white hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/#company"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Company
              </Link>
              <Link
                href="/login"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/onboarding"
                className="px-5 py-2.5 text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              >
                Get started
              </Link>
            </div>

            <Link
              href="/login"
              className="md:hidden px-4 py-2 text-sm font-medium text-white border border-white/30 rounded-lg"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs font-medium tracking-[0.1em] uppercase text-white/70">
              Transparent pricing
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-normal text-white leading-[1.15] tracking-[-0.02em] mb-6 max-w-3xl mx-auto">
            Pricing that scales with you
          </h1>

          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Transparent per-lead pricing for property developers, estate agents,
            and mortgage brokers. Only pay for what you use.
          </p>
        </div>
      </section>

      {/* ── Calculator Section ── */}
      <section className="pb-24 md:pb-32">
        <div className="container mx-auto px-6">
          <PricingCalculator />
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-24 md:py-32 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                FAQ
              </span>
            </div>
            <h2 className="text-3xl md:text-[40px] font-normal text-white leading-[1.2] tracking-[-0.01em]">
              Frequently asked questions
            </h2>
          </div>
          <PricingFAQ />
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 md:py-32 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#171717] rounded-2xl p-10 md:p-16 text-center relative overflow-hidden border border-[#2E2E2E]">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#34D399]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#34D399]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-[40px] font-normal text-white leading-[1.2] tracking-[-0.01em] mb-4">
                  Ready to stop losing deals?
                </h2>
                <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                  Join the UK&apos;s leading developers using AI to predict which
                  buyers will complete.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:Kofi@naybourhood.ai"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#34D399] text-[#0A0A0A] font-medium rounded-lg hover:bg-[#34D399]/90 transition-colors"
                  >
                    Book a Demo
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white border border-white/30 font-medium rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Or start your free trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <LogoIcon className="w-8 h-8" variant="light" />
              <span className="text-sm text-white/50">
                &copy; {new Date().getFullYear()} Naybourhood. All rights
                reserved.
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/privacy"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <a
                href="mailto:hello@naybourhood.ai"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
