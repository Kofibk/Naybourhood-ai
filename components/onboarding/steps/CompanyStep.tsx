'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { OnboardingFormData } from '@/lib/onboarding'
import { ArrowLeft, Building2, Loader2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompanyStepProps {
  data: OnboardingFormData
  onNext: (data: Partial<OnboardingFormData>) => void
  onBack: () => void
  isSaving: boolean
}

const regionSuggestions = [
  'London',
  'South East',
  'South West',
  'Midlands',
  'North West',
  'North East',
  'Scotland',
  'Wales',
  'International',
]

export default function CompanyStep({
  data,
  onNext,
  onBack,
  isSaving,
}: CompanyStepProps) {
  const [companyName, setCompanyName] = useState(data.companyName)
  const [companyLogoUrl, setCompanyLogoUrl] = useState(data.companyLogoUrl)
  const [website, setWebsite] = useState(data.website)
  const [linkedin, setLinkedin] = useState(data.linkedin)
  const [instagram, setInstagram] = useState(data.instagram)
  const [businessAddress, setBusinessAddress] = useState(data.businessAddress)
  const [regionsCovered, setRegionsCovered] = useState<string[]>(data.regionsCovered)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!companyName.trim()) newErrors.companyName = 'Company name is required'
    if (regionsCovered.length === 0) newErrors.regions = 'Select at least one region'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      onNext({
        companyName: companyName.trim(),
        companyLogoUrl,
        website: website.trim(),
        linkedin: linkedin.trim(),
        instagram: instagram.trim(),
        businessAddress: businessAddress.trim(),
        regionsCovered,
      })
    }
  }

  const toggleRegion = (region: string) => {
    if (regionsCovered.includes(region)) {
      setRegionsCovered(regionsCovered.filter((r) => r !== region))
    } else {
      setRegionsCovered([...regionsCovered, region])
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Company Information
        </h1>
        <p className="text-muted-foreground">
          Tell us about your business
        </p>
      </div>

      {/* Company Logo Upload */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className={cn(
              'w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center',
              'bg-muted/50 cursor-pointer hover:bg-muted transition-colors',
              companyLogoUrl ? 'border-primary' : 'border-border'
            )}
          >
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt="Company logo"
                className="w-full h-full rounded-lg object-contain p-2"
              />
            ) : (
              <Building2 className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <button
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            title="Upload logo"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your Company Ltd"
            className={errors.companyName ? 'border-destructive' : ''}
          />
          {errors.companyName && (
            <p className="text-sm text-destructive">{errors.companyName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Input
              id="businessAddress"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="123 Business Street, London"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="linkedin.com/company/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@yourcompany"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Regions Covered <span className="text-destructive">*</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {regionSuggestions.map((region) => {
              const isSelected = regionsCovered.includes(region)
              return (
                <Badge
                  key={region}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors px-3 py-1.5',
                    isSelected
                      ? 'bg-primary hover:bg-primary/90'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => toggleRegion(region)}
                >
                  {region}
                  {isSelected && <X className="w-3 h-3 ml-1" />}
                </Badge>
              )
            })}
          </div>
          {errors.regions && (
            <p className="text-sm text-destructive">{errors.regions}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
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
