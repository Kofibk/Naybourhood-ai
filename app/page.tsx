'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { Logo, LogoIcon } from '@/components/Logo'
import { AuthHandler } from '@/components/AuthHandler'
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  Zap,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react'

// Client logos for the trusted by section
const clientLogos = [
  'Regal London',
  'GRID',
  'Consero',
  'Kebbell',
  'JLL',
  'City Docklands',
  'River Park Tower',
  'London Square',
  'AJI',
  'Plum Guide',
  'Fine & Country',
  'Berkeley Group',
  'Mount Anvil',
  'Hadley Property Group',
]

// Product features for the overview section
const productFeatures = [
  {
    icon: Sparkles,
    title: 'AI Scoring',
    description: 'Proceedability scores based on 50+ buyer signals including employment, assets, and mortgage readiness.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification',
    description: 'Automated ID, proof of funds, and AML checks integrated into your buyer journey.',
  },
  {
    icon: TrendingUp,
    title: 'Conversion Prediction',
    description: 'Machine learning models trained on thousands of UK property transactions.',
  },
]

// How it works steps
const howItWorks = [
  {
    step: '01',
    title: 'Connect Your Pipeline',
    description: 'Integrate with your existing CRM or upload buyer data. We work with Salesforce, HubSpot, and custom systems.',
  },
  {
    step: '02',
    title: 'Enrich & Score',
    description: 'Our AI analyses each buyer against 50+ data points to generate a proceedability score from 0-100.',
  },
  {
    step: '03',
    title: 'Prioritise & Act',
    description: 'Focus your team on buyers most likely to complete. Automate nurture sequences for others.',
  },
  {
    step: '04',
    title: 'Track & Optimise',
    description: 'Real-time dashboards show conversion rates, time-to-completion, and pipeline health.',
  },
]

// Platform benefits
const platformBenefits = [
  {
    icon: Clock,
    stat: '3x',
    label: 'Faster qualification',
    description: 'Reduce time spent on unqualified buyers',
  },
  {
    icon: CheckCircle2,
    stat: '85%',
    label: 'Completion rate',
    description: 'On AI-qualified top-tier buyers',
  },
  {
    icon: Users,
    stat: '60%',
    label: 'Less admin time',
    description: 'Automated verification workflows',
  },
  {
    icon: Zap,
    stat: '24hrs',
    label: 'Average scoring time',
    description: 'From enquiry to full buyer report',
  },
]


export default function LandingPage() {
  const [showModal, setShowModal] = useState(false)
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formError, setFormError] = useState('')

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  async function handleWaitlistSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('submitting')
    setFormError('')

    const form = e.currentTarget
    const field = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement).value
    const data = {
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
      company: field('company'),
      role: field('role'),
      monthly_lead_volume: field('monthly_lead_volume'),
      biggest_challenge: field('biggest_challenge'),
      would_pay: field('would_pay'),
      current_spend: field('current_spend'),
      referral_source: field('referral_source'),
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setFormState('error')
        setFormError(result.error || 'Something went wrong.')
        return
      }

      setFormState('success')
    } catch {
      setFormState('error')
      setFormError('Network error. Please try again.')
    }
  }

  function openModal() {
    setFormState('idle')
    setFormError('')
    setShowModal(true)
  }

  return (
    <div className="min-h-screen">
      {/* Handle auth tokens from URL hash */}
      <AuthHandler />

      {/* ============================================
          HERO SECTION - Full viewport with dark overlay
          ============================================ */}
      <section className="relative min-h-screen bg-[#0A0A0A] overflow-hidden">
        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=2000&q=80')`,
          }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)' }} />
        </div>

        {/* Navigation */}
        <header className="relative z-20">
          <div className="container mx-auto px-6 py-6">
            <nav className="flex items-center justify-between">
              <Link href="/">
                <Logo variant="light" size="md" />
              </Link>

              <div className="hidden md:flex items-center gap-8">
                <Link
                  href="#product"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Product
                </Link>
                <Link
                  href="#company"
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

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 pt-20 md:pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Early Access Badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-white/70">
                NAYBOURHOOD EARLY ACCESS
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-normal text-white leading-[1.15] tracking-[-0.02em] mb-6">
              Know which buyers are proceedable.
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
              Predict who will complete—not just who&apos;s interested.
            </p>

            {/* CTA Button */}
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-md hover:bg-white/90 hover:shadow-lg transition-all duration-200"
            >
              Join Waitlist
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Client Logos */}
        <div className="relative z-10 border-t border-white/10">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {clientLogos.slice(0, 7).map((client, i) => (
                <span
                  key={i}
                  className="text-sm font-medium text-white/50 whitespace-nowrap"
                >
                  {client}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          WAITLIST MODAL — Dark mode
          ============================================ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div className="relative w-full max-w-lg bg-[#171717] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {formState === 'success' ? (
              <div className="text-center py-16 px-8">
                <CheckCircle className="w-14 h-14 text-[#34D399] mx-auto mb-5" />
                <h3 className="text-2xl font-semibold text-white mb-2">
                  You&apos;re on the list!
                </h3>
                <p className="text-white/60">
                  We&apos;ll be in touch soon with early access details.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-8 px-8 py-2.5 bg-[#34D399] text-[#0A0A0A] font-medium rounded-lg hover:bg-[#34D399]/90 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Header — fixed */}
                <div className="px-8 pt-8 pb-4">
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                    <span className="text-xs font-medium tracking-[0.1em] uppercase text-white/50">
                      EARLY ACCESS
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Join the Waitlist
                  </h3>
                  <p className="text-sm text-white/50">
                    Be first to access AI-powered buyer intelligence.
                  </p>
                </div>

                {/* Scrollable form area */}
                <form onSubmit={handleWaitlistSubmit} className="overflow-y-auto flex-1 px-8 pb-8">
                  <div className="space-y-4">
                    {/* ── Contact details ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1">
                          Name <span className="text-[#34D399]">*</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          placeholder="Jane Smith"
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">
                          Email <span className="text-[#34D399]">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="jane@company.com"
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-white/70 mb-1">
                          Phone
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+44 7700 900000"
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-white/70 mb-1">
                          Company <span className="text-[#34D399]">*</span>
                        </label>
                        <input
                          id="company"
                          name="company"
                          type="text"
                          required
                          placeholder="Acme Developments"
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* ── Role & volume ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-white/70 mb-1">
                          Role <span className="text-[#34D399]">*</span>
                        </label>
                        <select
                          id="role"
                          name="role"
                          required
                          defaultValue=""
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        >
                          <option value="" disabled className="text-white/30">Select role</option>
                          <option value="Developer / Housebuilder">Developer / Housebuilder</option>
                          <option value="Estate Agent">Estate Agent</option>
                          <option value="Mortgage Broker">Mortgage Broker</option>
                          <option value="Conveyancer / Solicitor">Conveyancer / Solicitor</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="monthly_lead_volume" className="block text-sm font-medium text-white/70 mb-1">
                          Monthly leads <span className="text-[#34D399]">*</span>
                        </label>
                        <select
                          id="monthly_lead_volume"
                          name="monthly_lead_volume"
                          required
                          defaultValue=""
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        >
                          <option value="" disabled className="text-white/30">Select volume</option>
                          <option value="Under 50">Under 50</option>
                          <option value="50–200">50–200</option>
                          <option value="200–500">200–500</option>
                          <option value="500+">500+</option>
                        </select>
                      </div>
                    </div>

                    {/* ── Qualifying questions ── */}
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs font-medium tracking-[0.1em] uppercase text-white/30 mb-3">A few quick questions</p>
                    </div>

                    <div>
                      <label htmlFor="biggest_challenge" className="block text-sm font-medium text-white/70 mb-1">
                        Biggest challenge <span className="text-[#34D399]">*</span>
                      </label>
                      <select
                        id="biggest_challenge"
                        name="biggest_challenge"
                        required
                        defaultValue=""
                        className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                      >
                        <option value="" disabled className="text-white/30">Select challenge</option>
                        <option value="Too many leads falling through">Too many leads falling through</option>
                        <option value="Can't tell which buyers are serious">Can&apos;t tell which buyers are serious</option>
                        <option value="Sales team wasting time on unqualified leads">Sales team wasting time on unqualified leads</option>
                        <option value="No visibility on buyer financial status">No visibility on buyer financial status</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="would_pay" className="block text-sm font-medium text-white/70 mb-1">
                        Would you pay for this? <span className="text-[#34D399]">*</span>
                      </label>
                      <select
                        id="would_pay"
                        name="would_pay"
                        required
                        defaultValue=""
                        className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                      >
                        <option value="" disabled className="text-white/30">Select option</option>
                        <option value="Yes — actively looking for this">Yes — actively looking for this</option>
                        <option value="Interested — want to see it first">Interested — want to see it first</option>
                        <option value="Just exploring">Just exploring</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="current_spend" className="block text-sm font-medium text-white/70 mb-1">
                          Current spend <span className="text-[#34D399]">*</span>
                        </label>
                        <select
                          id="current_spend"
                          name="current_spend"
                          required
                          defaultValue=""
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        >
                          <option value="" disabled className="text-white/30">Select range</option>
                          <option value="Nothing — we do it manually">Nothing — manual</option>
                          <option value="Under £500">Under £500</option>
                          <option value="£500–£2,000">£500–£2,000</option>
                          <option value="£2,000+">£2,000+</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="referral_source" className="block text-sm font-medium text-white/70 mb-1">
                          How did you hear? <span className="text-[#34D399]">*</span>
                        </label>
                        <select
                          id="referral_source"
                          name="referral_source"
                          required
                          defaultValue=""
                          className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent"
                        >
                          <option value="" disabled className="text-white/30">Select source</option>
                          <option value="Referral">Referral</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Social media">Social media</option>
                          <option value="Event">Event</option>
                          <option value="Search">Search</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {formState === 'error' && formError && (
                      <p className="text-sm text-red-400">{formError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={formState === 'submitting'}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#34D399] text-[#0A0A0A] font-medium rounded-lg hover:bg-[#34D399]/90 transition-colors disabled:opacity-60 mt-2"
                    >
                      {formState === 'submitting' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ============================================
          PRODUCT OVERVIEW - White background
          ============================================ */}
      <section id="product" className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Column - Content */}
            <div>
              {/* Section Label */}
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#525252]">
                  BUYER INTELLIGENCE
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl md:text-[40px] font-normal text-[#0A0A0A] leading-[1.2] tracking-[-0.01em] mb-8">
                Built to predict completions
              </h2>

              {/* Feature Cards */}
              <div className="space-y-6">
                {productFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-6 bg-[#F5F5F5] rounded-xl"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-200 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[#0A0A0A] mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-[#525252] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Floating UI Mockup */}
            <div className="relative lg:pl-8">
              <div
                className="relative bg-[#171717] rounded-2xl p-6 shadow-giga transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
              >
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-white font-medium">Buyer Pipeline</span>
                  </div>
                  <span className="text-[#34D399] text-sm font-medium">Live</span>
                </div>

                {/* Mock Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-2xl font-semibold text-white mb-1">847</p>
                    <p className="text-xs text-white/60">Active Buyers</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-2xl font-semibold text-[#34D399] mb-1">92</p>
                    <p className="text-xs text-white/60">Score 80+</p>
                  </div>
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <p className="text-2xl font-semibold text-white mb-1">23</p>
                    <p className="text-xs text-white/60">Ready Now</p>
                  </div>
                </div>

                {/* Mock Buyer List */}
                <div className="space-y-3">
                  {[
                    { name: 'J. Thompson', score: 94, status: 'Verified', budget: '850K' },
                    { name: 'S. Patel', score: 87, status: 'Pending', budget: '1.2M' },
                    { name: 'M. Chen', score: 82, status: 'Verified', budget: '650K' },
                  ].map((buyer, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#171717] flex items-center justify-center">
                          <span className="text-xs text-white/70">{buyer.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{buyer.name}</p>
                          <p className="text-xs text-white/50">Budget: {buyer.budget}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${buyer.status === 'Verified' ? 'bg-emerald-200 text-emerald-500' : 'bg-amber-100 text-amber-600'}`}>
                          {buyer.status}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-[#34D399]">{buyer.score}</p>
                          <p className="text-[10px] text-white/50 uppercase">Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#34D399]/10 rounded-full blur-3xl" />
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-[#34D399]/5 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS - Dark background
          ============================================ */}
      <section className="bg-[#0A0A0A] py-24 md:py-32">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                HOW IT WORKS
              </span>
            </div>
            <h2 className="text-3xl md:text-[40px] font-normal text-white leading-[1.2] tracking-[-0.01em]">
              From enquiry to completion
            </h2>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative">
                {/* Connector line (except last) */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#34D399]/50 to-transparent" />
                )}

                <div className="bg-[#171717] rounded-xl p-6 h-full">
                  <span className="text-[#34D399] text-xs font-medium tracking-[0.15em] uppercase mb-4 block">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-medium text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          RESULTS / STATS - White background
          ============================================ */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#525252]">
                RESULTS
              </span>
            </div>
            <h2 className="text-3xl md:text-[40px] font-normal text-[#0A0A0A] leading-[1.2] tracking-[-0.01em]">
              Built for housebuilders who want to close
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {platformBenefits.map((benefit, i) => (
              <div
                key={i}
                className="text-center p-8 bg-[#F5F5F5] rounded-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-4xl md:text-5xl font-normal text-[#0A0A0A] mb-2">
                  {benefit.stat}
                </p>
                <p className="text-lg font-medium text-[#0A0A0A] mb-1">
                  {benefit.label}
                </p>
                <p className="text-sm text-[#525252]">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================
          WHO IT'S FOR - Dark background
          ============================================ */}
      <section id="company" className="bg-[#0A0A0A] py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div>
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                  WHO IT&apos;S FOR
                </span>
              </div>
              <h2 className="text-3xl md:text-[40px] font-normal text-white leading-[1.2] tracking-[-0.01em] mb-6">
                Built for UK property sales teams
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Whether you&apos;re selling new builds, managing off-plan reservations, or handling high-value resales, Naybourhood gives you the intelligence to focus on buyers who will actually complete.
              </p>

              <div className="space-y-4">
                {[
                  'Housebuilders and developers',
                  'Sales and marketing directors',
                  'Estate agents with new homes teams',
                  'Property investment platforms',
                  'Mortgage brokers, wealth managers and financial advisors',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#34D399]" />
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Image with overlay */}
            <div className="relative">
              <div
                className="aspect-[4/3] rounded-2xl bg-cover bg-center overflow-hidden"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80')`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-[#171717]/90 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Average deal value</p>
                        <p className="text-sm text-white/60">Qualified buyers</p>
                      </div>
                      <p className="text-3xl font-normal text-[#34D399]">£1.2M</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION - White background with card
          ============================================ */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0A0A0A] rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#34D399]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#34D399]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-3 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                  <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                    GET STARTED
                  </span>
                </div>
                <h2 className="text-3xl md:text-[40px] font-normal text-white leading-[1.2] tracking-[-0.01em] mb-4">
                  Ready to qualify smarter?
                </h2>
                <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                  Join the UK&apos;s leading developers using AI to predict which buyers will complete.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:kofi@naybourhood.ai"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-md hover:bg-white/90 hover:shadow-lg transition-all duration-200"
                  >
                    Talk to us
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={openModal}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white border border-white/30 font-medium rounded-md hover:bg-white/10 transition-colors"
                  >
                    Join Waitlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER - Dark background
          ============================================ */}
      <footer className="bg-[#0A0A0A] border-t border-white/10 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <LogoIcon className="w-8 h-8" variant="light" />
              <span className="text-sm text-white/50">
                &copy; 2024 Naybourhood. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-sm text-white/50 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-white/50 hover:text-white transition-colors">
                Terms
              </Link>
              <a href="mailto:hello@naybourhood.ai" className="text-sm text-white/50 hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
