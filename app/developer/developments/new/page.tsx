'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  FileText,
  StickyNote,
} from 'lucide-react'

interface DevFormData {
  development_name: string
  city: string
  region: string
  postcode: string
  full_address: string
  price_from: string
  price_to: string
  total_units: string
  unit_types: string
  tenure: string
  completion_date: string
  completion_status: string
  brochure_url: string
  notes: string
}

const initialForm: DevFormData = {
  development_name: '',
  city: '',
  region: '',
  postcode: '',
  full_address: '',
  price_from: '',
  price_to: '',
  total_units: '',
  unit_types: '',
  tenure: '',
  completion_date: '',
  completion_status: 'Coming Soon',
  brochure_url: '',
  notes: '',
}

export default function AddDevelopmentPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [form, setForm] = useState<DevFormData>(initialForm)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof DevFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.development_name.trim()) {
      toast.error('Development name is required')
      return
    }

    if (!isSupabaseConfigured()) {
      toast.error('Database not configured')
      return
    }

    const companyId = user?.company_id
    if (!companyId) {
      toast.error('No company associated with your account')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const insertData: Record<string, any> = {
        development_name: form.development_name.trim(),
        company_id: companyId,
      }

      // Only include non-empty fields
      if (form.city.trim()) insertData.city = form.city.trim()
      if (form.region.trim()) insertData.region = form.region.trim()
      if (form.postcode.trim()) insertData.postcode = form.postcode.trim()
      if (form.full_address.trim()) insertData.full_address = form.full_address.trim()
      if (form.price_from.trim()) insertData.price_from = parseFloat(form.price_from)
      if (form.price_to.trim()) insertData.price_to = parseFloat(form.price_to)
      if (form.total_units.trim()) insertData.total_units = parseInt(form.total_units)
      if (form.unit_types.trim()) insertData.unit_types = form.unit_types.trim()
      if (form.tenure.trim()) insertData.tenure = form.tenure.trim()
      if (form.completion_date.trim()) insertData.completion_date = form.completion_date.trim()
      if (form.completion_status.trim()) insertData.completion_status = form.completion_status.trim()
      if (form.brochure_url.trim()) insertData.brochure_url = form.brochure_url.trim()
      if (form.notes.trim()) insertData.notes = form.notes.trim()

      const { error } = await supabase.from('developments').insert(insertData)

      if (error) throw error

      toast.success('Development created successfully')
      router.push('/developer/developments')
    } catch (err: any) {
      console.error('[AddDevelopment] Error:', err)
      toast.error('Failed to create development', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'text-sm font-medium text-white/70 mb-1.5 block'
  const inputClass = 'bg-[#111111] border-white/10 text-white placeholder:text-white/30'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/developer/developments')}
          className="text-white/70 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">Add Development</h2>
          <p className="text-sm text-white/50">Create a new development for your company</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelClass}>Development Name *</label>
              <Input
                placeholder="e.g. Test Towers"
                value={form.development_name}
                onChange={e => update('development_name', e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Completion Status</label>
                <select
                  value={form.completion_status}
                  onChange={e => update('completion_status', e.target.value)}
                  className="w-full h-9 px-3 bg-[#111111] border border-white/10 rounded-md text-sm text-white"
                >
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Active">Active</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tenure</label>
                <select
                  value={form.tenure}
                  onChange={e => update('tenure', e.target.value)}
                  className="w-full h-9 px-3 bg-[#111111] border border-white/10 rounded-md text-sm text-white"
                >
                  <option value="">Select...</option>
                  <option value="Freehold">Freehold</option>
                  <option value="Leasehold">Leasehold</option>
                  <option value="Share of Freehold">Share of Freehold</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <Input
                  placeholder="e.g. London"
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <Input
                  placeholder="e.g. Greater London"
                  value={form.region}
                  onChange={e => update('region', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Postcode</label>
                <Input
                  placeholder="e.g. E1 6AN"
                  value={form.postcode}
                  onChange={e => update('postcode', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Completion Date</label>
                <Input
                  type="date"
                  value={form.completion_date}
                  onChange={e => update('completion_date', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Full Address</label>
              <Input
                placeholder="Full street address"
                value={form.full_address}
                onChange={e => update('full_address', e.target.value)}
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Units & Pricing */}
        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              Units & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Total Units</label>
                <Input
                  type="number"
                  placeholder="e.g. 200"
                  value={form.total_units}
                  onChange={e => update('total_units', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Unit Types</label>
                <Input
                  placeholder="e.g. 1-bed, 2-bed, 3-bed"
                  value={form.unit_types}
                  onChange={e => update('unit_types', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Price From</label>
                <Input
                  type="number"
                  placeholder="e.g. 500000"
                  value={form.price_from}
                  onChange={e => update('price_from', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Price To</label>
                <Input
                  type="number"
                  placeholder="e.g. 1500000"
                  value={form.price_to}
                  onChange={e => update('price_to', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional */}
        <Card className="bg-[#111111] border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-purple-400" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelClass}>Brochure URL</label>
              <Input
                placeholder="https://..."
                value={form.brochure_url}
                onChange={e => update('brochure_url', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                placeholder="Internal notes about this development..."
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-md text-sm text-white placeholder:text-white/30 min-h-[80px] resize-y"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/developer/developments')}
            className="border-white/10 text-white/70 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !form.development_name.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Create Development
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
