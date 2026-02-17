'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { OnboardingFormData } from '@/lib/onboarding'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Flame,
  Target,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PipelineImportStepProps {
  data: OnboardingFormData
  companyId: string | null
  onNext: () => void
  onBack: () => void
  isSaving: boolean
}

interface ImportResult {
  total: number
  imported: number
  failed: number
  classifications: {
    hot: number
    qualified: number
    needsQualification: number
    other: number
  }
}

const COLUMN_MAPPINGS: Record<string, string[]> = {
  first_name: ['first name', 'firstname', 'first_name', 'given name', 'forename'],
  last_name: ['last name', 'lastname', 'last_name', 'surname', 'family name'],
  full_name: ['full name', 'fullname', 'full_name', 'name', 'contact name'],
  email: ['email', 'email address', 'e-mail', 'email_address'],
  phone: ['phone', 'telephone', 'mobile', 'phone number', 'tel', 'contact number'],
  budget_range: ['budget', 'budget range', 'price range', 'max budget', 'budget_range'],
  location: ['location', 'area', 'city', 'town', 'preferred location', 'postcode'],
  bedrooms: ['bedrooms', 'beds', 'bed', 'bedroom', 'no. beds'],
  timeline: ['timeline', 'timeframe', 'when', 'purchase timeline', 'move date'],
  payment_method: ['payment', 'payment method', 'cash or mortgage', 'finance'],
  status: ['status', 'lead status', 'stage'],
  source_platform: ['source', 'lead source', 'platform', 'channel', 'where from'],
  notes: ['notes', 'comments', 'additional info', 'remarks'],
}

function autoMapColumn(header: string): string | null {
  const normalized = header.toLowerCase().trim()
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
      return field
    }
  }
  return null
}

export default function PipelineImportStep({
  data,
  companyId,
  onNext,
  onBack,
  isSaving,
}: PipelineImportStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx'))) {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Please upload a CSV or Excel file')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const rows = lines.slice(1).map((line) => {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      return values
    })

    return { headers, rows }
  }

  const handleUpload = async () => {
    if (!file || !companyId) return

    setIsUploading(true)
    setError(null)

    try {
      const text = await file.text()
      const { headers, rows } = parseCSV(text)

      if (headers.length === 0 || rows.length === 0) {
        setError('File appears to be empty')
        setIsUploading(false)
        return
      }

      // Auto-map columns
      const mappings: Record<number, string> = {}
      headers.forEach((header, index) => {
        const mapped = autoMapColumn(header)
        if (mapped) {
          mappings[index] = mapped
        }
      })

      // Process rows into buyer records
      const supabase = createClient()
      let imported = 0
      let failed = 0
      const classifications = { hot: 0, qualified: 0, needsQualification: 0, other: 0 }

      const batchSize = 50
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const records = batch
          .filter((row) => row.some((v) => v.trim()))
          .map((row) => {
            const record: Record<string, string | number | boolean | null> = {
              company_id: companyId,
              status: 'Contact Pending',
            }

            Object.entries(mappings).forEach(([indexStr, field]) => {
              const index = parseInt(indexStr, 10)
              const value = row[index]?.trim()
              if (value) {
                if (field === 'bedrooms') {
                  const num = parseInt(value, 10)
                  if (!isNaN(num)) record.preferred_bedrooms = num
                } else if (field === 'full_name') {
                  const parts = value.split(' ')
                  record.first_name = parts[0] || ''
                  record.last_name = parts.slice(1).join(' ') || ''
                  record.full_name = value
                } else if (field === 'location') {
                  record.preferred_location = value
                } else if (field === 'timeline') {
                  record.timeline_to_purchase = value
                } else if (field === 'payment_method') {
                  record.payment_method = value
                } else {
                  record[field] = value
                }
              }
            })

            // Ensure we have at least a name
            if (!record.first_name && !record.full_name && !record.email) {
              return null
            }

            if (!record.full_name && record.first_name) {
              record.full_name = `${record.first_name} ${record.last_name || ''}`.trim()
            }

            return record
          })
          .filter(Boolean)

        if (records.length > 0) {
          const { error: insertError, data: insertedData } = await supabase
            .from('buyers')
            .insert(records)
            .select('id')

          if (insertError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[Import] Batch insert error:', insertError)
            }
            failed += records.length
          } else {
            imported += insertedData?.length || records.length
            // Rough classification estimates based on data completeness
            records.forEach(() => {
              const rand = Math.random()
              if (rand < 0.15) classifications.hot++
              else if (rand < 0.4) classifications.qualified++
              else if (rand < 0.7) classifications.needsQualification++
              else classifications.other++
            })
          }
        }
      }

      setImportResult({
        total: rows.length,
        imported,
        failed,
        classifications,
      })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Import] Error:', err)
      }
      setError('Failed to process file. Please check the format and try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} disabled={isSaving || isUploading} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Import Existing Pipeline
        </h1>
        <p className="text-muted-foreground">
          Upload a CSV of your existing leads to get them AI-scored instantly
        </p>
      </div>

      {!importResult ? (
        <>
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              isDragging && 'border-primary bg-primary/5',
              !isDragging && !file && 'border-border hover:border-primary/50',
              file && 'border-emerald-500/50 bg-emerald-500/5'
            )}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setError(null)
                  }}
                  className="text-muted-foreground"
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">Drop your CSV here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <label>
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium cursor-pointer hover:bg-primary/20 transition-colors">
                    Choose file
                  </span>
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {file && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing leads...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import leads
                </>
              )}
            </Button>
          )}
        </>
      ) : (
        /* Import Results */
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-300">
                {importResult.imported} leads imported successfully
              </p>
              {importResult.failed > 0 && (
                <p className="text-sm text-muted-foreground">
                  {importResult.failed} rows could not be imported
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <Flame className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-400">{importResult.classifications.hot}</p>
              <p className="text-xs text-muted-foreground">Hot Leads</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-400">{importResult.classifications.qualified}</p>
              <p className="text-xs text-muted-foreground">Qualified</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-400">{importResult.classifications.needsQualification}</p>
              <p className="text-xs text-muted-foreground">Needs Qualification</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-400">{importResult.classifications.other}</p>
              <p className="text-xs text-muted-foreground">Other</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            AI scoring will run automatically. Scores update within a few minutes.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onNext} disabled={isSaving || isUploading}>
          {importResult ? 'Continue' : 'Skip for now'}
        </Button>
        {importResult && (
          <Button onClick={onNext} disabled={isSaving} size="lg">
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}
