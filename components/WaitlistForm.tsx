'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface WaitlistFormProps {
  onSuccess?: () => void
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    monthly_lead_volume: '',
    biggest_challenge: '',
    would_pay: null as boolean | null,
    current_spend: '',
    referral_source: '',
  })

  const update = (field: string, value: string | boolean | null) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('submitting')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setMessage(data.error || 'Something went wrong')
        return
      }

      setState('success')
      setMessage(data.message)
      onSuccess?.()
    } catch {
      setState('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center py-12 px-6">
        <CheckCircle2 className="w-12 h-12 text-[#34D399] mx-auto mb-4" />
        <h3 className="text-xl font-medium text-[#0A0A0A] mb-2">You&apos;re on the list!</h3>
        <p className="text-[#525252]">{message}</p>
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#0A0A0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#34D399]/50 focus:border-[#34D399]'
  const labelClass = 'block text-xs font-medium text-[#525252] mb-1.5'
  const selectClass = `${inputClass} appearance-none`

  return (
    <form onSubmit={handleSubmit} className="px-2 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-[#0A0A0A]">Join the Waitlist</h3>
        <p className="text-sm text-[#525252]">Get early access to Naybourhood</p>
      </div>

      {/* Name + Email (required) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            required
            placeholder="Full name"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Phone + Company */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            placeholder="+44 7XXX XXXXXX"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <input
            type="text"
            placeholder="Company name"
            value={form.company}
            onChange={e => update('company', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Role + Monthly Lead Volume */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Your Role</label>
          <select
            value={form.role}
            onChange={e => update('role', e.target.value)}
            className={selectClass}
          >
            <option value="">Select role</option>
            <option value="developer">Developer / Housebuilder</option>
            <option value="agent">Estate Agent</option>
            <option value="broker">Mortgage Broker</option>
            <option value="marketing_agency">Marketing Agency</option>
            <option value="financial_advisor">Financial Advisor</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Monthly Lead Volume</label>
          <select
            value={form.monthly_lead_volume}
            onChange={e => update('monthly_lead_volume', e.target.value)}
            className={selectClass}
          >
            <option value="">Select volume</option>
            <option value="1-50">1–50 leads</option>
            <option value="50-200">50–200 leads</option>
            <option value="200-500">200–500 leads</option>
            <option value="500+">500+ leads</option>
          </select>
        </div>
      </div>

      {/* Biggest Challenge */}
      <div>
        <label className={labelClass}>Biggest Challenge</label>
        <textarea
          placeholder="What's your biggest challenge with buyer qualification?"
          value={form.biggest_challenge}
          onChange={e => update('biggest_challenge', e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Would Pay + Current Spend */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Would you pay for this?</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => update('would_pay', true)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                form.would_pay === true
                  ? 'bg-[#34D399]/10 border-[#34D399] text-[#0A0A0A]'
                  : 'border-gray-200 text-[#525252] hover:border-gray-300'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => update('would_pay', false)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                form.would_pay === false
                  ? 'bg-red-50 border-red-300 text-[#0A0A0A]'
                  : 'border-gray-200 text-[#525252] hover:border-gray-300'
              }`}
            >
              No
            </button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Current Monthly Spend</label>
          <select
            value={form.current_spend}
            onChange={e => update('current_spend', e.target.value)}
            className={selectClass}
          >
            <option value="">Select spend</option>
            <option value="nothing">Nothing yet</option>
            <option value="under_1k">Under £1,000</option>
            <option value="1k-5k">£1,000 – £5,000</option>
            <option value="5k-10k">£5,000 – £10,000</option>
            <option value="10k+">£10,000+</option>
          </select>
        </div>
      </div>

      {/* Referral Source */}
      <div>
        <label className={labelClass}>How did you hear about us?</label>
        <select
          value={form.referral_source}
          onChange={e => update('referral_source', e.target.value)}
          className={selectClass}
        >
          <option value="">Select source</option>
          <option value="google">Google</option>
          <option value="linkedin">LinkedIn</option>
          <option value="referral">Referral</option>
          <option value="event">Event / Conference</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Error message */}
      {state === 'error' && (
        <p className="text-sm text-red-500 text-center">{message}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={state === 'submitting' || !form.name || !form.email}
        className="w-full py-3 bg-[#0A0A0A] text-white font-medium rounded-lg hover:bg-[#171717] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? 'Joining...' : 'Join Waitlist'}
      </button>
    </form>
  )
}
