'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Loader2, CheckCircle2 } from 'lucide-react'
import { calculateNBScore } from '@/lib/scoring/nb-score'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

interface LeadIntakeFormProps {
  onCreated?: () => void
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function LeadIntakeForm({ onCreated }: LeadIntakeFormProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ quality: number; intent: number; classification: string } | null>(null)
  const { user } = useAuth()

  // Developments dropdown data
  const [developments, setDevelopments] = useState<{ id: string; name: string }[]>([])
  const [isLoadingDevs, setIsLoadingDevs] = useState(false)

  useEffect(() => {
    const fetchDevelopments = async () => {
      const companyId = user?.company_id
      if (!isSupabaseConfigured() || !companyId) return
      setIsLoadingDevs(true)
      try {
        const supabase = createClient()
        if (!supabase) return
        const { data } = await supabase
          .from('developments')
          .select('id, development_name')
          .eq('company_id', companyId)
          .order('development_name')
        if (data) setDevelopments(data.map((d: any) => ({ id: d.id, name: d.development_name || 'Unnamed' })))
      } catch { /* ignore */ }
      finally { setIsLoadingDevs(false) }
    }
    if (open) fetchDevelopments()
  }, [open, user?.company_id])

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    budget_range: '',
    payment_method: '',
    bedrooms: '',
    location: '',
    timeline: '',
    purpose: '',
    source: '',
    development_id: '',
  })

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const reset = () => {
    setForm({
      full_name: '', email: '', phone: '', country: '',
      budget_range: '', payment_method: '', bedrooms: '',
      location: '', timeline: '', purpose: '', source: '', development_id: '',
    })
    setState('idle')
    setResult(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('submitting')
    setError('')

    try {
      // Resolve development_name from selected development_id
      const selectedDev = developments.find(d => d.id === form.development_id)
      const payload: Record<string, any> = {
        ...form,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        development_name: selectedDev?.name || undefined,
      }
      // Remove development_id from payload if empty
      if (!payload.development_id) delete payload.development_id

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setError(data.error || 'Failed to create buyer')
        return
      }

      setState('success')
      setResult({
        quality: data.lead?.ai_quality_score || 0,
        intent: data.lead?.ai_intent_score || 0,
        classification: data.lead?.ai_classification || 'Unknown',
      })
      onCreated?.()
    } catch {
      setState('error')
      setError('Network error. Please try again.')
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="w-4 h-4" />
        Add Buyer
      </Button>
    )
  }

  const inputClass = 'bg-background border-border'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Add New Buyer</h3>
          <button
            onClick={() => { setOpen(false); reset() }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {state === 'success' && result && (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-lg font-medium">Buyer Created & Scored</h4>
            <div className="flex items-center justify-center gap-6">
              <NBScoreRing
                score={calculateNBScore(result.quality, result.intent, 0)}
                size={72}
                label="NB Score"
              />
              <div className="text-left space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Quality:</span> {result.quality}</p>
                <p className="text-sm"><span className="text-muted-foreground">Intent:</span> {result.intent}</p>
                <p className="text-sm"><span className="text-muted-foreground">Classification:</span> {result.classification}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => { reset() }}>Add Another</Button>
              <Button onClick={() => { setOpen(false); reset() }}>Done</Button>
            </div>
          </div>
        )}

        {/* Form */}
        {state !== 'success' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
            {/* Name (required) */}
            <div>
              <label className={labelClass}>Full Name *</label>
              <Input
                required
                placeholder="John Smith"
                value={form.full_name}
                onChange={e => update('full_name', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <Input
                  type="tel"
                  placeholder="+44 7XXX XXXXXX"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Country + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Country</label>
                <Input
                  placeholder="United Kingdom"
                  value={form.country}
                  onChange={e => update('country', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Preferred Location</label>
                <Input
                  placeholder="London, Zone 1-2"
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Budget + Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Budget Range</label>
                <select
                  value={form.budget_range}
                  onChange={e => update('budget_range', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select budget</option>
                  <option value="Under £250k">Under £250k</option>
                  <option value="£250k-£500k">£250k – £500k</option>
                  <option value="£500k-£750k">£500k – £750k</option>
                  <option value="£750k-£1M">£750k – £1M</option>
                  <option value="£1M-£2M">£1M – £2M</option>
                  <option value="£2M+">£2M+</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={e => update('payment_method', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="Mortgage">Mortgage</option>
                </select>
              </div>
            </div>

            {/* Bedrooms + Timeline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bedrooms</label>
                <select
                  value={form.bedrooms}
                  onChange={e => update('bedrooms', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select</option>
                  <option value="1">1 bed</option>
                  <option value="2">2 beds</option>
                  <option value="3">3 beds</option>
                  <option value="4">4+ beds</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Timeline</label>
                <select
                  value={form.timeline}
                  onChange={e => update('timeline', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select timeline</option>
                  <option value="ASAP">ASAP / 28 days</option>
                  <option value="1-3 months">1–3 months</option>
                  <option value="3-6 months">3–6 months</option>
                  <option value="6-12 months">6–12 months</option>
                  <option value="12+ months">12+ months</option>
                </select>
              </div>
            </div>

            {/* Purpose + Source */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Purpose</label>
                <select
                  value={form.purpose}
                  onChange={e => update('purpose', e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select purpose</option>
                  <option value="Investment">Investment</option>
                  <option value="Residence">Residence</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Source</label>
                <Input
                  placeholder="e.g. Rightmove, Referral"
                  value={form.source}
                  onChange={e => update('source', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Development */}
            <div>
              <label className={labelClass}>Development</label>
              <select
                value={form.development_id}
                onChange={e => update('development_id', e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border rounded-md text-sm"
                disabled={isLoadingDevs}
              >
                <option value="">Select development (optional)</option>
                {developments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
                {developments.length === 0 && !isLoadingDevs && (
                  <option disabled>No developments found</option>
                )}
              </select>
            </div>

            {/* Error */}
            {state === 'error' && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setOpen(false); reset() }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={state === 'submitting' || !form.full_name}
              >
                {state === 'submitting' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scoring...</>
                ) : (
                  'Create & Score'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
