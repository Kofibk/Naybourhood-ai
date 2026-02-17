'use client'

import { useState, useMemo } from 'react'
import {
  Zap,
  Megaphone,
  LayoutDashboard,
  Check,
  ArrowRight,
} from 'lucide-react'

type CustomerType = 'developer' | 'agent' | 'broker'

const customerTypeOptions = [
  { value: 'developer' as const, label: 'Developer' },
  { value: 'agent' as const, label: 'Estate Agent' },
  { value: 'broker' as const, label: 'Mortgage Broker' },
]

function calcScoringCost(leads: number, hasLeadGen: boolean): number {
  const rates = hasLeadGen ? [0.50, 0.375, 0.25] : [1.00, 0.75, 0.50]
  let cost = 0

  if (leads <= 1000) {
    cost = leads * rates[0]
  } else if (leads <= 5000) {
    cost = 1000 * rates[0] + (leads - 1000) * rates[1]
  } else {
    cost = 1000 * rates[0] + 4000 * rates[1] + (leads - 5000) * rates[2]
  }

  return Math.max(cost, 500)
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-GB').format(n)
}

// Slider component
function Slider({
  label,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  prefix?: string
  suffix?: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-sm font-medium text-white">
          {prefix}
          {fmtNum(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #34D399 0%, #34D399 ${pct}%, #2E2E2E ${pct}%, #2E2E2E 100%)`,
        }}
      />
    </div>
  )
}

// Toggle switch
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-[#34D399]' : 'bg-[#2E2E2E]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

const essentialsFeatures = [
  'AI buyer scoring (50+ signals)',
  'Proceedability predictions',
  'Basic buyer reports',
  'Email support',
]

const growthFeatures = [
  'Everything in Essentials',
  'Targeted campaign management',
  'Multi-channel lead capture',
  'Campaign analytics',
  'Priority support',
]

const fullStackFeatures = [
  'Everything in Growth',
  'Full buyer intelligence dashboard',
  'Automated verification workflows',
  'Team collaboration tools',
  'Custom integrations (API + webhooks)',
  'Dedicated account manager',
]

export default function PricingCalculator() {
  const [customerType, setCustomerType] = useState<CustomerType>('developer')
  const [leadGenOn, setLeadGenOn] = useState(false)
  const [crmOn, setCrmOn] = useState(false)
  const [leadsPerMonth, setLeadsPerMonth] = useState(1000)
  const [adSpend, setAdSpend] = useState(5000)
  const [developments, setDevelopments] = useState(3)
  const [extraSeats, setExtraSeats] = useState(0)
  const [teamSeats, setTeamSeats] = useState(5)

  const pricing = useMemo(() => {
    const scoringCost = calcScoringCost(leadsPerMonth, leadGenOn)
    const leadGenCost = leadGenOn ? Math.max(adSpend * 0.15, 1000) : 0
    let crmCost = 0
    if (crmOn) {
      if (customerType === 'developer') {
        crmCost = developments * 1000 + extraSeats * 199
      } else {
        crmCost = teamSeats * 199
      }
    }

    const monthlyTotal = scoringCost + leadGenCost + crmCost
    const annualMonthly = monthlyTotal * 0.9
    const annualSavings = monthlyTotal * 12 * 0.1

    const bundleName =
      leadGenOn && crmOn
        ? 'FULL STACK'
        : leadGenOn
        ? 'GROWTH'
        : 'ESSENTIALS'

    const rates = leadGenOn ? [0.50, 0.375, 0.25] : [1.00, 0.75, 0.50]

    // Scoring breakdown
    let scoringBreakdown: string
    if (leadsPerMonth <= 1000) {
      scoringBreakdown = `${fmtNum(leadsPerMonth)} leads × ${leadGenOn ? '50p' : '£1'} = ${fmt(leadsPerMonth * rates[0])}`
    } else if (leadsPerMonth <= 5000) {
      const first = 1000 * rates[0]
      const second = (leadsPerMonth - 1000) * rates[1]
      scoringBreakdown = `First 1,000 × ${leadGenOn ? '50p' : '£1'} = ${fmt(first)} + Next ${fmtNum(leadsPerMonth - 1000)} × ${leadGenOn ? '37.5p' : '75p'} = ${fmt(second)}`
    } else {
      const first = 1000 * rates[0]
      const second = 4000 * rates[1]
      const third = (leadsPerMonth - 5000) * rates[2]
      scoringBreakdown = `First 1,000 × ${leadGenOn ? '50p' : '£1'} = ${fmt(first)} + Next 4,000 × ${leadGenOn ? '37.5p' : '75p'} = ${fmt(second)} + Next ${fmtNum(leadsPerMonth - 5000)} × ${leadGenOn ? '25p' : '50p'} = ${fmt(third)}`
    }
    if (scoringCost === 500 && leadsPerMonth * rates[0] < 500) {
      scoringBreakdown += ' (minimum £500)'
    }

    // Lead gen breakdown
    const leadGenBreakdown = leadGenOn
      ? adSpend * 0.15 >= 1000
        ? `15% of ${fmt(adSpend)} = ${fmt(adSpend * 0.15)}`
        : `Minimum £1,000`
      : null

    // CRM breakdown
    let crmBreakdown: string[] = []
    if (crmOn) {
      if (customerType === 'developer') {
        const includedSeats = developments * 2
        crmBreakdown.push(
          `${developments} development${developments > 1 ? 's' : ''} × £1,000 = ${fmt(developments * 1000)} (includes ${includedSeats} seats)`
        )
        if (extraSeats > 0) {
          crmBreakdown.push(
            `${extraSeats} extra seat${extraSeats > 1 ? 's' : ''} × £199 = ${fmt(extraSeats * 199)}`
          )
        }
      } else {
        crmBreakdown.push(
          `${teamSeats} seat${teamSeats > 1 ? 's' : ''} × £199 = ${fmt(teamSeats * 199)}`
        )
      }
    }

    const features =
      bundleName === 'FULL STACK'
        ? fullStackFeatures
        : bundleName === 'GROWTH'
        ? growthFeatures
        : essentialsFeatures

    return {
      scoringCost,
      leadGenCost,
      crmCost,
      monthlyTotal,
      annualMonthly,
      annualSavings,
      bundleName,
      scoringBreakdown,
      leadGenBreakdown,
      crmBreakdown,
      features,
    }
  }, [customerType, leadGenOn, crmOn, leadsPerMonth, adSpend, developments, extraSeats, teamSeats])

  const ctaLabel = pricing.monthlyTotal > 3000 ? 'Book a Demo' : 'Get Started'
  const ctaHref =
    pricing.monthlyTotal > 3000
      ? 'mailto:Kofi@naybourhood.ai'
      : '/signup'

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start">
      {/* ── Left Panel: Configuration ── */}
      <div className="lg:col-span-3 space-y-8">
        {/* Customer type */}
        <div>
          <h3 className="text-sm font-medium text-white/70 uppercase tracking-[0.1em] mb-4">
            I am a...
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {customerTypeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCustomerType(opt.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  customerType === opt.value
                    ? 'bg-[#34D399] text-[#0A0A0A]'
                    : 'bg-[#171717] text-white/70 hover:text-white border border-[#2E2E2E]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-sm font-medium text-white/70 uppercase tracking-[0.1em] mb-4">
            Products
          </h3>
          <div className="space-y-3">
            {/* Scoring - always on */}
            <div className="flex items-center justify-between p-4 bg-[#171717] rounded-xl border border-[#2E2E2E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#34D399]" />
                </div>
                <div>
                  <p className="text-white font-medium">Scoring</p>
                  <p className="text-xs text-white/50">AI buyer scoring per lead</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-full bg-[#34D399]/10 text-[#34D399]">
                  Always on
                </span>
                <Toggle checked={true} onChange={() => {}} disabled />
              </div>
            </div>

            {/* Lead Generation */}
            <div className="flex items-center justify-between p-4 bg-[#171717] rounded-xl border border-[#2E2E2E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Lead Generation</p>
                  <p className="text-xs text-white/50">Targeted campaigns via your channels + MPH audience</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {leadGenOn && (
                  <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-full bg-amber-500/10 text-amber-400">
                    Scoring 50% off
                  </span>
                )}
                <Toggle checked={leadGenOn} onChange={setLeadGenOn} />
              </div>
            </div>

            {/* CRM Platform */}
            <div className="flex items-center justify-between p-4 bg-[#171717] rounded-xl border border-[#2E2E2E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">CRM Platform</p>
                  <p className="text-xs text-white/50">Full buyer intelligence dashboard</p>
                </div>
              </div>
              <Toggle checked={crmOn} onChange={setCrmOn} />
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6 bg-[#171717] rounded-xl border border-[#2E2E2E] p-6">
          <Slider
            label="Leads per month"
            value={leadsPerMonth}
            min={100}
            max={10000}
            step={100}
            onChange={setLeadsPerMonth}
          />
          {leadGenOn && (
            <Slider
              label="Monthly ad spend"
              value={adSpend}
              min={1000}
              max={50000}
              step={500}
              prefix="£"
              onChange={setAdSpend}
            />
          )}
          {crmOn && customerType === 'developer' && (
            <>
              <Slider
                label="Active developments"
                value={developments}
                min={1}
                max={15}
                step={1}
                onChange={setDevelopments}
              />
              <Slider
                label="Extra seats beyond included"
                value={extraSeats}
                min={0}
                max={20}
                step={1}
                onChange={setExtraSeats}
              />
            </>
          )}
          {crmOn && customerType !== 'developer' && (
            <Slider
              label="Team seats"
              value={teamSeats}
              min={2}
              max={30}
              step={1}
              onChange={setTeamSeats}
            />
          )}
        </div>

        {/* Volume tier reference */}
        <div className="bg-[#171717] rounded-xl border border-[#2E2E2E] p-6">
          <h4 className="text-sm font-medium text-white/70 uppercase tracking-[0.1em] mb-4">
            Volume tier rates
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50">
                  <th className="pb-3 font-medium">Leads / month</th>
                  <th className="pb-3 font-medium">Standard</th>
                  <th className="pb-3 font-medium">With Lead Gen</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-t border-[#2E2E2E]">
                  <td className="py-3">Up to 1,000</td>
                  <td className="py-3">£1.00 / lead</td>
                  <td className="py-3 text-[#34D399]">£0.50 / lead</td>
                </tr>
                <tr className="border-t border-[#2E2E2E]">
                  <td className="py-3">1,001 &ndash; 5,000</td>
                  <td className="py-3">£0.75 / lead</td>
                  <td className="py-3 text-[#34D399]">£0.375 / lead</td>
                </tr>
                <tr className="border-t border-[#2E2E2E]">
                  <td className="py-3">5,001+</td>
                  <td className="py-3">£0.50 / lead</td>
                  <td className="py-3 text-[#34D399]">£0.25 / lead</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-white/40 mt-3">
            Minimum £500/month. Re-scoring existing leads is free.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Sticky Summary ── */}
      <div className="lg:col-span-2 lg:sticky lg:top-8">
        <div className="bg-[#171717] rounded-2xl border border-[#2E2E2E] p-6 space-y-6">
          {/* Monthly total */}
          <div>
            <p className="text-sm text-white/50 mb-1">Monthly total</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold text-white">
                {fmt(pricing.monthlyTotal)}
              </span>
              <span className="text-sm text-white/50">/month</span>
            </div>
          </div>

          {/* Bundle pill */}
          <span
            className={`inline-block text-xs font-medium tracking-wider uppercase px-3 py-1.5 rounded-full ${
              pricing.bundleName === 'FULL STACK'
                ? 'bg-purple-500/10 text-purple-400'
                : pricing.bundleName === 'GROWTH'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-emerald-500/10 text-[#34D399]'
            }`}
          >
            {pricing.bundleName}
          </span>

          {/* Itemized breakdown */}
          <div className="space-y-4 border-t border-[#2E2E2E] pt-4">
            {/* Scoring */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/70">Scoring</span>
                <span className="text-sm font-medium text-white">
                  {fmt(pricing.scoringCost)}
                </span>
              </div>
              <p className="text-xs text-white/40">{pricing.scoringBreakdown}</p>
            </div>

            {/* Lead Gen */}
            {leadGenOn && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70">Lead Generation</span>
                  <span className="text-sm font-medium text-white">
                    {fmt(pricing.leadGenCost)}
                  </span>
                </div>
                <p className="text-xs text-white/40">{pricing.leadGenBreakdown}</p>
              </div>
            )}

            {/* CRM */}
            {crmOn &&
              pricing.crmBreakdown.map((line, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70">
                      {i === 0
                        ? customerType === 'developer'
                          ? 'CRM Developments'
                          : 'CRM Seats'
                        : 'CRM Extra Seats'}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {i === 0
                        ? customerType === 'developer'
                          ? fmt(developments * 1000)
                          : fmt(teamSeats * 199)
                        : fmt(extraSeats * 199)}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">{line}</p>
                </div>
              ))}
          </div>

          {/* Annual pricing */}
          <div className="bg-[#34D399]/10 rounded-xl p-4 border border-[#34D399]/20">
            <p className="text-sm font-medium text-[#34D399] mb-1">
              Pay annually: {fmt(Math.round(pricing.annualMonthly))}/mo
            </p>
            <p className="text-xs text-[#34D399]/70">
              Save {fmt(Math.round(pricing.annualSavings))}/year (10% discount)
            </p>
          </div>

          {/* CTA */}
          <a
            href={ctaHref}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#34D399] text-[#0A0A0A] font-medium rounded-lg hover:bg-[#34D399]/90 transition-colors"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </a>

          {/* What's included */}
          <div className="border-t border-[#2E2E2E] pt-4">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
              What&apos;s included
            </p>
            <ul className="space-y-2">
              {pricing.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-[#34D399] mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
