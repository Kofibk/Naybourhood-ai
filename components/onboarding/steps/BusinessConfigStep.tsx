'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OnboardingFormData, DevelopmentFormData } from '@/lib/onboarding'
import {
  ArrowLeft,
  Building2,
  Plus,
  Trash2,
  Loader2,
  MapPin,
  Home,
  Landmark,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BusinessConfigStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  onBack: () => void
  isSaving: boolean
}

const emptyDevelopment: DevelopmentFormData = {
  name: '',
  city: '',
  postcode: '',
  priceFrom: '',
  priceTo: '',
  totalUnits: '',
  bedroomMix: '',
  completionStatus: 'Active',
}

const completionStatuses = ['Active', 'Coming Soon', 'Sold Out', 'Paused']

const propertyTypeOptions = [
  'Residential Sales',
  'Lettings',
  'New Build',
  'Commercial',
  'Land',
]

const specialismOptions = [
  'Residential Mortgages',
  'Buy-to-Let',
  'Bridging Finance',
  'Development Finance',
  'Commercial Mortgages',
  'Equity Release',
]

export default function BusinessConfigStep({
  data,
  onNext,
  onBack,
  isSaving,
}: BusinessConfigStepProps) {
  const [developments, setDevelopments] = useState<DevelopmentFormData[]>(
    data.developments.length > 0 ? data.developments : [{ ...emptyDevelopment }]
  )
  const [geographicCoverage, setGeographicCoverage] = useState(data.geographicCoverage)
  const [propertyTypes, setPropertyTypes] = useState<string[]>(data.propertyTypes)
  const [specialisms, setSpecialisms] = useState<string[]>(data.specialisms)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const userType = data.userType

  const updateDevelopment = (index: number, field: keyof DevelopmentFormData, value: string) => {
    const updated = [...developments]
    updated[index] = { ...updated[index], [field]: value }
    setDevelopments(updated)
  }

  const addDevelopment = () => {
    setDevelopments([...developments, { ...emptyDevelopment }])
  }

  const removeDevelopment = (index: number) => {
    if (developments.length > 1) {
      setDevelopments(developments.filter((_, i) => i !== index))
    }
  }

  const togglePropertyType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const toggleSpecialism = (spec: string) => {
    setSpecialisms((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (userType === 'developer') {
      const firstDev = developments[0]
      if (!firstDev.name.trim()) {
        newErrors.devName = 'Development name is required'
      }
      if (!firstDev.city.trim()) {
        newErrors.devCity = 'City is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) return

    onNext({
      developments: userType === 'developer' ? developments : [],
      geographicCoverage: userType === 'agent' ? geographicCoverage : '',
      propertyTypes: userType === 'agent' ? propertyTypes : [],
      specialisms: userType === 'broker' ? specialisms : [],
    })
  }

  const handleSkip = () => {
    onNext({
      developments: [],
      geographicCoverage: '',
      propertyTypes: [],
      specialisms: [],
    })
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} disabled={isSaving} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Developer: Add Developments */}
      {userType === 'developer' && (
        <>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
              Your Developments
            </h1>
            <p className="text-muted-foreground">
              Add your first development to start receiving scored leads
            </p>
          </div>

          {developments.map((dev, index) => (
            <div key={index} className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">
                  {developments.length > 1 ? `Development ${index + 1}` : 'Development Details'}
                </h3>
                {developments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevelopment(index)}
                    className="text-destructive hover:text-destructive h-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={dev.name}
                    onChange={(e) => updateDevelopment(index, 'name', e.target.value)}
                    placeholder="e.g. The Willows"
                    className={index === 0 && errors.devName ? 'border-destructive' : ''}
                  />
                  {index === 0 && errors.devName && (
                    <p className="text-sm text-destructive">{errors.devName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={dev.city}
                    onChange={(e) => updateDevelopment(index, 'city', e.target.value)}
                    placeholder="e.g. Manchester"
                    className={index === 0 && errors.devCity ? 'border-destructive' : ''}
                  />
                  {index === 0 && errors.devCity && (
                    <p className="text-sm text-destructive">{errors.devCity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Postcode</Label>
                  <Input
                    value={dev.postcode}
                    onChange={(e) => updateDevelopment(index, 'postcode', e.target.value)}
                    placeholder="e.g. M1 1AA"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Price from</Label>
                  <Input
                    value={dev.priceFrom}
                    onChange={(e) => updateDevelopment(index, 'priceFrom', e.target.value)}
                    placeholder="e.g. 250000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Price to</Label>
                  <Input
                    value={dev.priceTo}
                    onChange={(e) => updateDevelopment(index, 'priceTo', e.target.value)}
                    placeholder="e.g. 500000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total units</Label>
                  <Input
                    value={dev.totalUnits}
                    onChange={(e) => updateDevelopment(index, 'totalUnits', e.target.value)}
                    placeholder="e.g. 50"
                    type="number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bedroom mix</Label>
                  <Input
                    value={dev.bedroomMix}
                    onChange={(e) => updateDevelopment(index, 'bedroomMix', e.target.value)}
                    placeholder="e.g. 1-3 beds"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Status</Label>
                  <div className="flex gap-2 flex-wrap">
                    {completionStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateDevelopment(index, 'completionStatus', status)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                          dev.completionStatus === status
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addDevelopment}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add another development
          </Button>
        </>
      )}

      {/* Agent: Branch Details */}
      {userType === 'agent' && (
        <>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
              Your Agency
            </h1>
            <p className="text-muted-foreground">
              Tell us about your branch and services
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Geographic coverage</Label>
              <Input
                value={geographicCoverage}
                onChange={(e) => setGeographicCoverage(e.target.value)}
                placeholder="e.g. Greater London, Surrey, Kent"
              />
            </div>

            <div className="space-y-3">
              <Label>Property types handled</Label>
              <div className="grid grid-cols-2 gap-2">
                {propertyTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePropertyType(type)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors text-left',
                      propertyTypes.includes(type)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                        propertyTypes.includes(type)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {propertyTypes.includes(type) && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Lead Sources</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Rightmove / Zoopla portal feed — coming soon</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can connect lead sources after setup in your dashboard settings.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Broker: Practice Details */}
      {userType === 'broker' && (
        <>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
              Your Practice
            </h1>
            <p className="text-muted-foreground">
              Tell us about your specialisms
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Specialisms</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {specialismOptions.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialism(spec)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors text-left',
                      specialisms.includes(spec)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                        specialisms.includes(spec)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {specialisms.includes(spec) && (
                        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Geographic coverage</Label>
              <Input
                value={geographicCoverage}
                onChange={(e) => setGeographicCoverage(e.target.value)}
                placeholder="e.g. Nationwide, London & South East"
              />
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={handleSkip} disabled={isSaving}>
          Skip for now
        </Button>
        <Button onClick={handleContinue} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}
