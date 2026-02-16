'use client'

import { useState, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  AlertCircle,
  Loader2,
  Columns,
  Eye,
  Rocket,
  PartyPopper,
  Flame,
  Target,
  Sparkles,
  Users,
} from 'lucide-react'

// ---------- Target buyer fields ----------

const TARGET_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'budget_range', label: 'Budget Range', required: false },
  { key: 'preferred_bedrooms', label: 'Preferred Bedrooms', required: false },
  { key: 'purchase_purpose', label: 'Purchase Purpose', required: false },
  { key: 'payment_method', label: 'Payment Method', required: false },
  { key: 'timeline_to_purchase', label: 'Timeline to Purchase', required: false },
  { key: 'preferred_location', label: 'Preferred Location', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'development_name', label: 'Development Name', required: false },
] as const

type TargetFieldKey = typeof TARGET_FIELDS[number]['key']

// ---------- Auto-matching heuristics ----------

const AUTO_MATCH_MAP: Record<string, TargetFieldKey> = {
  'first name': 'first_name',
  'first_name': 'first_name',
  'firstname': 'first_name',
  'fname': 'first_name',
  'last name': 'last_name',
  'last_name': 'last_name',
  'lastname': 'last_name',
  'lname': 'last_name',
  'surname': 'last_name',
  'email': 'email',
  'e-mail': 'email',
  'email address': 'email',
  'phone': 'phone',
  'phone number': 'phone',
  'mobile': 'phone',
  'tel': 'phone',
  'telephone': 'phone',
  'contact number': 'phone',
  'budget': 'budget_range',
  'budget range': 'budget_range',
  'budget_range': 'budget_range',
  'price range': 'budget_range',
  'bedrooms': 'preferred_bedrooms',
  'beds': 'preferred_bedrooms',
  'preferred bedrooms': 'preferred_bedrooms',
  'preferred_bedrooms': 'preferred_bedrooms',
  'no of beds': 'preferred_bedrooms',
  'purchase purpose': 'purchase_purpose',
  'purchase_purpose': 'purchase_purpose',
  'purpose': 'purchase_purpose',
  'intent': 'purchase_purpose',
  'payment method': 'payment_method',
  'payment_method': 'payment_method',
  'cash or mortgage': 'payment_method',
  'finance': 'payment_method',
  'timeline': 'timeline_to_purchase',
  'timeline to purchase': 'timeline_to_purchase',
  'timeline_to_purchase': 'timeline_to_purchase',
  'purchase timeline': 'timeline_to_purchase',
  'when': 'timeline_to_purchase',
  'location': 'preferred_location',
  'preferred location': 'preferred_location',
  'preferred_location': 'preferred_location',
  'area': 'preferred_location',
  'region': 'preferred_location',
  'country': 'country',
  'nationality': 'country',
  'development': 'development_name',
  'development name': 'development_name',
  'development_name': 'development_name',
  'project': 'development_name',
  'property': 'development_name',
}

// ---------- Steps ----------

type Step = 'upload' | 'mapping' | 'preview' | 'import' | 'results'

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'mapping', label: 'Map Columns', icon: Columns },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'import', label: 'Import', icon: Rocket },
  { key: 'results', label: 'Results', icon: PartyPopper },
]

export default function CSVImportPage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({}) // csvHeader -> targetField
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState<{
    total: number
    success: number
    errors: number
    classifications: Record<string, number>
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Get company_id
  const companyId = useMemo(() => {
    if (user?.company_id) return user.company_id
    try {
      const stored = localStorage.getItem('naybourhood_user')
      if (stored) return JSON.parse(stored).company_id
    } catch { /* ignore */ }
    return null
  }, [user])

  // ---------- Step 1: Upload ----------

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setFile(selectedFile)

    Papa.parse(selectedFile, {
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data || result.data.length < 2) {
          toast.error('CSV file is empty or has no data rows')
          return
        }

        const headers = (result.data[0] as string[]).map(h => h.trim()).filter(Boolean)
        const rows = (result.data as string[][]).slice(1).filter(row =>
          row.some(cell => cell && cell.trim() !== '')
        )

        setCsvHeaders(headers)
        setCsvData(rows)

        // Auto-match columns (first match wins to avoid duplicate target assignments)
        const autoMapping: Record<string, string> = {}
        const usedTargets = new Set<string>()
        headers.forEach(header => {
          const normalized = header.toLowerCase().trim()
          const target = AUTO_MATCH_MAP[normalized]
          if (target && !usedTargets.has(target)) {
            autoMapping[header] = target
            usedTargets.add(target)
          }
        })
        setMapping(autoMapping)
        setStep('mapping')
      },
      error: (err) => {
        toast.error('Failed to parse CSV file')
        console.error('CSV parse error:', err)
      },
    })
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }, [handleFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  // ---------- Step 2: Mapping ----------

  const updateMapping = useCallback((csvHeader: string, targetField: string) => {
    setMapping(prev => {
      const next = { ...prev }
      if (targetField === '__skip__') {
        delete next[csvHeader]
      } else {
        next[csvHeader] = targetField
      }
      return next
    })
  }, [])

  const mappedTargetFields = useMemo(() => {
    return new Set(Object.values(mapping))
  }, [mapping])

  const hasFirstName = mappedTargetFields.has('first_name')

  // ---------- Step 3: Preview ----------

  const previewRows = useMemo(() => {
    return csvData.slice(0, 5).map(row => {
      const mapped: Record<string, string> = {}
      csvHeaders.forEach((header, idx) => {
        const target = mapping[header]
        if (target) {
          mapped[target] = row[idx] || ''
        }
      })
      return mapped
    })
  }, [csvData, csvHeaders, mapping])

  const missingFirstNameCount = useMemo(() => {
    const firstNameIdx = csvHeaders.findIndex(h => mapping[h] === 'first_name')
    if (firstNameIdx === -1) return csvData.length
    return csvData.filter(row => !row[firstNameIdx]?.trim()).length
  }, [csvData, csvHeaders, mapping])

  // ---------- Step 4: Import ----------

  const handleImport = useCallback(async () => {
    if (!isSupabaseConfigured() || !companyId) {
      toast.error('Unable to import — no company configured')
      return
    }

    setImporting(true)
    setStep('import')
    setProgress({ done: 0, total: csvData.length })

    const supabase = createClient()
    let successCount = 0
    let errorCount = 0
    const insertedIds: string[] = []

    // Insert individually so the auto-scoring trigger fires per row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      const record: Record<string, any> = {
        company_id: companyId,
        data_source_primary: 'csv_import',
        channel: 'csv_import',
        status: 'Contact Pending',
      }

      csvHeaders.forEach((header, idx) => {
        const target = mapping[header]
        if (target && row[idx]?.trim()) {
          record[target] = row[idx].trim()
        }
      })

      // Build full_name
      if (record.first_name || record.last_name) {
        record.full_name = `${record.first_name || ''} ${record.last_name || ''}`.trim()
      }

      const { data, error } = await supabase.from('buyers').insert(record).select('id').single()
      if (error) {
        console.error('Insert error:', error)
        errorCount++
      } else {
        successCount++
        if (data?.id) insertedIds.push(data.id)
      }

      // Update progress every row
      setProgress({ done: i + 1, total: csvData.length })
    }

    // Wait for AI scoring triggers to fire
    await new Promise(resolve => setTimeout(resolve, 4000))

    // Fetch classification breakdown from the specific imported buyers
    const classifications: Record<string, number> = {}
    try {
      if (insertedIds.length > 0) {
        // Query in batches of 100 IDs to avoid URL length limits
        for (let i = 0; i < insertedIds.length; i += 100) {
          const idBatch = insertedIds.slice(i, i + 100)
          const { data: importedBuyers } = await supabase
            .from('buyers')
            .select('ai_classification')
            .in('id', idBatch)

          if (importedBuyers) {
            importedBuyers.forEach((b: { ai_classification: string | null }) => {
              const cls = b.ai_classification || 'Unscored'
              classifications[cls] = (classifications[cls] || 0) + 1
            })
          }
        }
      }
    } catch (err) {
      console.error('Error fetching classifications:', err)
    }

    setResults({
      total: csvData.length,
      success: successCount,
      errors: errorCount,
      classifications,
    })

    setImporting(false)
    setStep('results')

    if (errorCount === 0) {
      toast.success(`${successCount} buyers imported and scored`)
    } else {
      toast.warning(`${successCount} imported, ${errorCount} failed`)
    }
  }, [csvData, csvHeaders, mapping, companyId])

  // ---------- Step indicator ----------

  const currentStepIdx = STEPS.findIndex(s => s.key === step)

  // ---------- Render ----------

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/developer/buyers')}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-white">Import Buyers from CSV</h1>
          <p className="text-sm text-white/50">
            Upload a CSV file to bulk import buyer data
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => {
          const isComplete = idx < currentStepIdx
          const isCurrent = idx === currentStepIdx
          const Icon = s.icon

          return (
            <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
              {idx > 0 && (
                <div className={`w-8 h-px ${isComplete ? 'bg-emerald-500' : 'bg-white/10'}`} />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCurrent
                      ? 'bg-[#34D399]/20 text-[#34D399] ring-2 ring-[#34D399]/30'
                      : 'bg-white/5 text-white/30'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap ${
                    isCurrent ? 'text-white' : isComplete ? 'text-white/60' : 'text-white/30'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-white/30 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-white">Upload your CSV file</h2>
              <p className="text-sm text-white/50 mt-1">
                Drag and drop a CSV file or click to browse
              </p>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#34D399] bg-[#34D399]/5'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className={`h-10 w-10 mx-auto mb-3 ${
                dragOver ? 'text-[#34D399]' : 'text-white/40'
              }`} />
              <p className="text-white font-medium">
                {dragOver ? 'Drop your file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-white/40 mt-1">CSV files only</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-2">Expected columns</h3>
              <div className="flex flex-wrap gap-2">
                {TARGET_FIELDS.map(f => (
                  <Badge
                    key={f.key}
                    variant="secondary"
                    className={`text-xs ${
                      f.required
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-white/10 text-white/60 border-white/10'
                    }`}
                  >
                    {f.label}
                    {f.required && ' *'}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-2">* Required fields</p>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Map your columns</h2>
              <p className="text-sm text-white/50 mt-1">
                We auto-matched what we could. Adjust any mappings below.
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <FileSpreadsheet className="h-5 w-5 text-[#34D399]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{file.name}</p>
                  <p className="text-xs text-white/40">
                    {csvData.length} rows &middot; {csvHeaders.length} columns
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                <span>CSV Column</span>
                <span>Map to Buyer Field</span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {csvHeaders.map(header => {
                  const currentTarget = mapping[header] || ''
                  const isMatched = !!currentTarget

                  return (
                    <div
                      key={header}
                      className={`grid grid-cols-2 gap-4 items-center px-3 py-2.5 rounded-xl transition-colors ${
                        isMatched ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-white/5 border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isMatched ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-white/20 flex-shrink-0" />
                        )}
                        <span className="text-sm text-white truncate">{header}</span>
                      </div>
                      <Select
                        value={currentTarget || '__skip__'}
                        onValueChange={(val) => updateMapping(header, val)}
                      >
                        <SelectTrigger className="bg-[#0A0A0A] border-white/10 text-sm h-9">
                          <SelectValue placeholder="Skip this column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip__">
                            <span className="text-white/40">Skip this column</span>
                          </SelectItem>
                          {TARGET_FIELDS.map(f => {
                            const alreadyUsed = mappedTargetFields.has(f.key) && mapping[header] !== f.key
                            return (
                              <SelectItem
                                key={f.key}
                                value={f.key}
                                disabled={alreadyUsed}
                              >
                                {f.label}
                                {f.required && ' *'}
                                {alreadyUsed && ' (used)'}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            </div>

            {!hasFirstName && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-400">
                  <strong>first_name</strong> is required. Please map a column to First Name.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setCsvHeaders([])
                  setCsvData([])
                  setMapping({})
                }}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!hasFirstName}
                className="bg-[#34D399] hover:bg-[#34D399]/80 text-black font-medium"
              >
                Next: Preview <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Preview import</h2>
                <p className="text-sm text-white/50 mt-1">
                  Verify your data looks correct before importing
                </p>
              </div>
              <Badge className="bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20 text-sm">
                {csvData.length} buyers ready to import
              </Badge>
            </div>

            {/* Preview table */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      {TARGET_FIELDS.filter(f => mappedTargetFields.has(f.key)).map(f => (
                        <th
                          key={f.key}
                          className="px-4 py-3 text-left text-xs font-medium text-white/50 whitespace-nowrap"
                        >
                          {f.label}
                          {f.required && <span className="text-red-400"> *</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        {TARGET_FIELDS.filter(f => mappedTargetFields.has(f.key)).map(f => {
                          const value = row[f.key] || ''
                          const isMissing = f.required && !value

                          return (
                            <td
                              key={f.key}
                              className={`px-4 py-3 whitespace-nowrap ${
                                isMissing ? 'text-red-400' : 'text-white/80'
                              }`}
                            >
                              {isMissing ? (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Missing
                                </span>
                              ) : (
                                value || <span className="text-white/20">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <div className="bg-white/5 px-4 py-2 text-xs text-white/40 text-center border-t border-white/10">
                  Showing first 5 of {csvData.length} rows
                </div>
              )}
            </div>

            {/* Warnings */}
            {missingFirstNameCount > 0 && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-400">
                  {missingFirstNameCount} row{missingFirstNameCount > 1 ? 's' : ''} missing
                  required <strong>first_name</strong> — these will still be imported but may
                  appear as &quot;Unknown&quot;.
                </p>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 text-sm text-white/60">
              <p>Each row will be imported with:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-white/40">
                <li>Status: <span className="text-white/60">Contact Pending</span></li>
                <li>Source: <span className="text-white/60">CSV Import</span></li>
                <li>AI scoring will run automatically on each buyer</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep('mapping')}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleImport}
                className="bg-[#34D399] hover:bg-[#34D399]/80 text-black font-medium"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Import {csvData.length} Buyers
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === 'import' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-[#34D399] animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white">Importing buyers...</h2>
              <p className="text-sm text-white/50 mt-1">
                This may take a moment. AI scoring runs on each buyer.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Progress</span>
                <span className="text-white font-medium">
                  {progress.done} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#34D399] to-emerald-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-white/40 text-center">
                {Math.round(progress.total > 0 ? (progress.done / progress.total) * 100 : 0)}%
                complete
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 'results' && results && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {results.success} buyers imported and scored
              </h2>
              {results.errors > 0 && (
                <p className="text-sm text-red-400 mt-1">
                  {results.errors} rows failed to import
                </p>
              )}
            </div>

            {/* Classification breakdown */}
            {Object.keys(results.classifications).length > 0 && (
              <div className="bg-white/5 rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/60 mb-4">
                  Classification Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(results.classifications).map(([cls, count]) => {
                    const icons: Record<string, { icon: React.ElementType; color: string }> = {
                      'Hot Lead': { icon: Flame, color: 'text-red-400 bg-red-500/10' },
                      'Qualified': { icon: Target, color: 'text-emerald-400 bg-emerald-500/10' },
                      'Warm': { icon: Sparkles, color: 'text-amber-400 bg-amber-500/10' },
                      'Nurture': { icon: Users, color: 'text-blue-400 bg-blue-500/10' },
                      'Cold': { icon: Users, color: 'text-slate-400 bg-slate-500/10' },
                    }
                    const cfg = icons[cls] || { icon: Users, color: 'text-white/40 bg-white/5' }
                    const Icon = cfg.icon

                    return (
                      <div
                        key={cls}
                        className="flex items-center gap-3 bg-white/5 rounded-xl p-3"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{count}</p>
                          <p className="text-xs text-white/50">{cls}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                onClick={() => router.push('/developer/buyers')}
                className="w-full sm:w-auto bg-[#34D399] hover:bg-[#34D399]/80 text-black font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                View Buyers
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setCsvHeaders([])
                  setCsvData([])
                  setMapping({})
                  setResults(null)
                }}
                className="w-full sm:w-auto text-white/60 hover:text-white"
              >
                Import Another File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
