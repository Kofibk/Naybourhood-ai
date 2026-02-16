'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Target,
  Brain,
  Shield,
  TrendingUp,
  Plus,
  Eye,
} from 'lucide-react'
import type { Development } from '@/types'

// ---------- Constants ----------

const BUDGET_RANGES = [
  'Under £500K',
  '£500K-£750K',
  '£750K-£1M',
  '£1M-£1.5M',
  '£1.5M-£2M',
  '£2M-£3M',
  '£3M-£5M',
  '£5M+',
] as const

const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4+'] as const

const PURCHASE_PURPOSES = [
  'Primary Residence',
  'Investment',
  'Dependent Studying in UK',
  'Holiday/Second Home',
] as const

const PAYMENT_METHODS = ['Cash', 'Mortgage'] as const

const TIMELINE_OPTIONS = [
  'Within 28 days',
  '1-3 months',
  '3-6 months',
  '6+ months',
] as const

// ---------- Helpers ----------

function parseBudgetRange(range: string): { min: number | null; max: number | null } {
  switch (range) {
    case 'Under £500K': return { min: null, max: 500000 }
    case '£500K-£750K': return { min: 500000, max: 750000 }
    case '£750K-£1M': return { min: 750000, max: 1000000 }
    case '£1M-£1.5M': return { min: 1000000, max: 1500000 }
    case '£1.5M-£2M': return { min: 1500000, max: 2000000 }
    case '£2M-£3M': return { min: 2000000, max: 3000000 }
    case '£3M-£5M': return { min: 3000000, max: 5000000 }
    case '£5M+': return { min: 5000000, max: null }
    default: return { min: null, max: null }
  }
}

function parseBedroomValue(value: string): number {
  if (value === 'Studio') return 0
  if (value === '4+') return 4
  return parseInt(value, 10)
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#34D399' // green
  if (score >= 40) return '#F59E0B' // amber
  return '#EF4444' // red
}

function getClassificationStyle(classification: string): { bg: string; text: string } {
  switch (classification) {
    case 'Hot Lead': return { bg: 'bg-red-500/20', text: 'text-red-400' }
    case 'Qualified': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    case 'Warm':
    case 'Needs Qualification': return { bg: 'bg-amber-500/20', text: 'text-amber-400' }
    case 'Nurture': return { bg: 'bg-blue-500/20', text: 'text-blue-400' }
    case 'Cold':
    case 'Low Priority': return { bg: 'bg-gray-500/20', text: 'text-gray-400' }
    case 'Disqualified': return { bg: 'bg-red-900/30', text: 'text-red-500' }
    default: return { bg: 'bg-gray-500/20', text: 'text-gray-400' }
  }
}

// ---------- Types ----------

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  country: string
  budgetRange: string
  preferredBedrooms: string
  preferredLocation: string
  purchasePurpose: string
  paymentMethod: string
  wantsMortgageBroker: boolean
  timelineToPurchase: string
  buyingWithin28Days: boolean
  developmentId: string
  notes: string
}

interface ScoreResult {
  buyerId: string
  finalScore: number | null
  aiClassification: string | null
  aiSummary: string | null
  aiNextAction: string | null
  aiQualityScore: number | null
  aiIntentScore: number | null
  aiConfidence: number | null
  aiRiskFlags: string[] | null
  conversionProbabilityPct: number | null
}

// ---------- Component ----------

export function AddBuyerForm() {
  const router = useRouter()
  const pathname = usePathname()
  const buyersPath = (pathname.split('/buyers')[0] || '/developer') + '/buyers'
  const { user } = useAuth()

  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'United Kingdom',
    budgetRange: '',
    preferredBedrooms: '',
    preferredLocation: '',
    purchasePurpose: '',
    paymentMethod: '',
    wantsMortgageBroker: false,
    timelineToPurchase: '',
    buyingWithin28Days: false,
    developmentId: '',
    notes: '',
  })

  // UI state
  const [developments, setDevelopments] = useState<Development[]>([])
  const [isLoadingDevs, setIsLoadingDevs] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  // Fetch company_id from user profile
  useEffect(() => {
    const getCompanyId = async () => {
      // First try from auth context
      if (user?.company_id) {
        setCompanyId(user.company_id)
        return
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('naybourhood_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.company_id) {
            setCompanyId(parsed.company_id)
            return
          }
        }
      } catch { /* ignore */ }

      // Fallback to Supabase user_profiles query
      if (!isSupabaseConfigured() || !user?.id) return
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (profile?.company_id) {
        setCompanyId(profile.company_id)
      }
    }

    getCompanyId()
  }, [user])

  // Fetch developments filtered by company_id
  useEffect(() => {
    const fetchDevelopments = async () => {
      if (!isSupabaseConfigured() || !companyId) {
        setIsLoadingDevs(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('developments')
        .select('id, name')
        .eq('company_id', companyId)
        .order('name')

      if (error) {
        console.error('[AddBuyerForm] Error fetching developments:', error)
      } else {
        setDevelopments(data || [])
      }
      setIsLoadingDevs(false)
    }

    fetchDevelopments()
  }, [companyId])

  // Auto-check "buying within 28 days" when timeline is "Within 28 days"
  useEffect(() => {
    if (formData.timelineToPurchase === 'Within 28 days') {
      setFormData(prev => ({ ...prev, buyingWithin28Days: true }))
    }
  }, [formData.timelineToPurchase])

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // ---------- Submit handler ----------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }

    if (!companyId) {
      toast.error('Unable to determine company. Please contact an administrator.')
      return
    }

    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Parse budget
      const { min: budgetMin, max: budgetMax } = formData.budgetRange
        ? parseBudgetRange(formData.budgetRange)
        : { min: null, max: null }

      // Parse bedrooms
      const preferredBedrooms = formData.preferredBedrooms
        ? parseBedroomValue(formData.preferredBedrooms)
        : null

      // Determine ready_within_28_days
      const readyWithin28Days =
        formData.timelineToPurchase === 'Within 28 days' || formData.buyingWithin28Days

      // Build insert payload
      const insertData: Record<string, any> = {
        company_id: companyId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        country: formData.country.trim() || null,
        budget_range: formData.budgetRange || null,
        budget_min: budgetMin,
        budget_max: budgetMax,
        preferred_bedrooms: preferredBedrooms,
        preferred_location: formData.preferredLocation.trim() || null,
        purchase_purpose: formData.purchasePurpose || null,
        payment_method: formData.paymentMethod || null,
        connect_to_broker: formData.wantsMortgageBroker,
        timeline_to_purchase: formData.timelineToPurchase || null,
        ready_within_28_days: readyWithin28Days,
        notes: formData.notes.trim() || null,
        data_source_primary: 'manual',
        channel: 'manual',
        status: 'Contact Pending',
      }

      // Add development_id if selected
      if (formData.developmentId) {
        insertData.development_id = formData.developmentId
      }

      // INSERT into buyers table
      const { data: newBuyer, error: insertError } = await supabase
        .from('buyers')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      toast.success('Buyer added successfully')

      // Wait for AFTER INSERT trigger to score the buyer
      const buyerId = newBuyer.id
      let scored = false

      // First attempt after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data: scoredBuyer, error: fetchError } = await supabase
        .from('buyers')
        .select('final_score, ai_classification, ai_summary, ai_next_action, ai_quality_score, ai_intent_score, ai_confidence, ai_risk_flags, conversion_probability_pct')
        .eq('id', buyerId)
        .single()

      if (!fetchError && scoredBuyer?.final_score !== null && scoredBuyer?.final_score !== undefined) {
        scored = true
        setScoreResult({
          buyerId,
          finalScore: scoredBuyer.final_score,
          aiClassification: scoredBuyer.ai_classification,
          aiSummary: scoredBuyer.ai_summary,
          aiNextAction: scoredBuyer.ai_next_action,
          aiQualityScore: scoredBuyer.ai_quality_score,
          aiIntentScore: scoredBuyer.ai_intent_score,
          aiConfidence: scoredBuyer.ai_confidence,
          aiRiskFlags: scoredBuyer.ai_risk_flags,
          conversionProbabilityPct: scoredBuyer.conversion_probability_pct,
        })
      }

      // Retry once after another second if scores are still null
      if (!scored) {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const { data: retryBuyer, error: retryError } = await supabase
          .from('buyers')
          .select('final_score, ai_classification, ai_summary, ai_next_action, ai_quality_score, ai_intent_score, ai_confidence, ai_risk_flags, conversion_probability_pct')
          .eq('id', buyerId)
          .single()

        if (!retryError && retryBuyer) {
          setScoreResult({
            buyerId,
            finalScore: retryBuyer.final_score,
            aiClassification: retryBuyer.ai_classification,
            aiSummary: retryBuyer.ai_summary,
            aiNextAction: retryBuyer.ai_next_action,
            aiQualityScore: retryBuyer.ai_quality_score,
            aiIntentScore: retryBuyer.ai_intent_score,
            aiConfidence: retryBuyer.ai_confidence,
            aiRiskFlags: retryBuyer.ai_risk_flags,
            conversionProbabilityPct: retryBuyer.conversion_probability_pct,
          })
        } else {
          // Show result even without scores
          setScoreResult({
            buyerId,
            finalScore: null,
            aiClassification: null,
            aiSummary: null,
            aiNextAction: null,
            aiQualityScore: null,
            aiIntentScore: null,
            aiConfidence: null,
            aiRiskFlags: null,
            conversionProbabilityPct: null,
          })
        }
      }
    } catch (error: any) {
      console.error('[AddBuyerForm] Submit error:', error)
      toast.error('Failed to add buyer', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------- Reset form ----------

  const handleAddAnother = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: 'United Kingdom',
      budgetRange: '',
      preferredBedrooms: '',
      preferredLocation: '',
      purchasePurpose: '',
      paymentMethod: '',
      wantsMortgageBroker: false,
      timelineToPurchase: '',
      buyingWithin28Days: false,
      developmentId: '',
      notes: '',
    })
    setScoreResult(null)
  }

  // ---------- Score Result Screen ----------

  if (scoreResult) {
    const score = scoreResult.finalScore
    const scoreColor = score !== null ? getScoreColor(score) : '#6B7280'
    const classification = scoreResult.aiClassification
    const classStyle = classification ? getClassificationStyle(classification) : null

    // SVG circular progress ring
    const radius = 54
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = score !== null
      ? circumference - (score / 100) * circumference
      : circumference

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(buyersPath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">AI Score Result</h2>
            <p className="text-sm text-muted-foreground">Buyer has been added and scored</p>
          </div>
        </div>

        {/* Score Ring */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none" stroke="currentColor"
                  className="text-white/10" strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none" stroke={scoreColor}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>
                  {score !== null ? Math.round(score) : '--'}
                </span>
                <span className="text-xs text-muted-foreground">NB Score</span>
              </div>
            </div>

            {/* Classification Badge */}
            {classification && classStyle && (
              <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${classStyle.bg} ${classStyle.text}`}>
                {classification}
              </div>
            )}

            {score === null && (
              <p className="text-sm text-muted-foreground text-center">
                Scoring is still processing. Check the buyer profile for updated scores.
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Summary */}
        {scoreResult.aiSummary && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-[#34D399]" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80 leading-relaxed">{scoreResult.aiSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Recommended Next Action */}
        {scoreResult.aiNextAction && (
          <Card className="border-[#34D399]/30 bg-[#34D399]/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-[#34D399]" />
                Recommended Next Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#34D399] font-medium">{scoreResult.aiNextAction}</p>
            </CardContent>
          </Card>
        )}

        {/* Sub-scores */}
        {(scoreResult.aiQualityScore !== null || scoreResult.aiIntentScore !== null || scoreResult.aiConfidence !== null) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreResult.aiQualityScore !== null && (
                <ScoreBar
                  label="Quality"
                  score={scoreResult.aiQualityScore}
                  icon={<Shield className="h-4 w-4" />}
                />
              )}
              {scoreResult.aiIntentScore !== null && (
                <ScoreBar
                  label="Intent"
                  score={scoreResult.aiIntentScore}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              )}
              {scoreResult.aiConfidence !== null && (
                <ScoreBar
                  label="Confidence"
                  score={scoreResult.aiConfidence}
                  icon={<Brain className="h-4 w-4" />}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Risk Flags */}
        {scoreResult.aiRiskFlags && scoreResult.aiRiskFlags.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Risk Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scoreResult.aiRiskFlags.map((flag, i) => (
                  <Badge key={i} variant="warning" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {flag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAddAnother}
            variant="outline"
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Buyer
          </Button>
          <Button
            onClick={() => router.push(`${buyersPath}/${scoreResult.buyerId}`)}
            variant="success"
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Buyer Profile
          </Button>
        </div>
      </div>
    )
  }

  // ---------- Form Render ----------

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(buyersPath)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Add Buyer</h2>
          <p className="text-sm text-muted-foreground">Manually add a new buyer and get an instant AI score</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required: Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name <span className="text-red-400">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={e => updateField('firstName', e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name <span className="text-red-400">*</span></Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={e => updateField('lastName', e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Buyer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="+44 7700 900000"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={e => updateField('country', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Requirements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Property Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Budget range</Label>
                <Select
                  value={formData.budgetRange}
                  onValueChange={v => updateField('budgetRange', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred bedrooms</Label>
                <Select
                  value={formData.preferredBedrooms}
                  onValueChange={v => updateField('preferredBedrooms', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bedrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {BEDROOM_OPTIONS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preferredLocation">Preferred location</Label>
              <Input
                id="preferredLocation"
                value={formData.preferredLocation}
                onChange={e => updateField('preferredLocation', e.target.value)}
                placeholder="e.g. Canary Wharf, London"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase purpose</Label>
              <Select
                value={formData.purchasePurpose}
                onValueChange={v => updateField('purchasePurpose', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_PURPOSES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Financial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={v => updateField('paymentMethod', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="wantsMortgageBroker"
                checked={formData.wantsMortgageBroker}
                onCheckedChange={v => updateField('wantsMortgageBroker', !!v)}
              />
              <Label htmlFor="wantsMortgageBroker" className="cursor-pointer text-sm">
                Wants mortgage broker?
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Timeline to purchase</Label>
              <Select
                value={formData.timelineToPurchase}
                onValueChange={v => updateField('timelineToPurchase', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  {TIMELINE_OPTIONS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="buyingWithin28Days"
                checked={formData.buyingWithin28Days}
                onCheckedChange={v => updateField('buyingWithin28Days', !!v)}
              />
              <Label htmlFor="buyingWithin28Days" className="cursor-pointer text-sm">
                Buying within 28 days?
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Development</Label>
              <Select
                value={formData.developmentId}
                onValueChange={v => updateField('developmentId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingDevs ? 'Loading developments...' : 'Select development (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  {developments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                  {!isLoadingDevs && developments.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No developments found</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => updateField('notes', e.target.value)}
                placeholder="Any additional notes about this buyer..."
                className="min-h-[100px] bg-[#171717] border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#34D399]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          variant="success"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !formData.firstName.trim() || !formData.lastName.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Adding buyer & scoring...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Buyer & Get AI Score
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

// ---------- Sub-components ----------

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = getScoreColor(score)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-white/70">
          {icon}
          {label}
        </span>
        <span className="font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
