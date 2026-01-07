'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CSVImportProps {
  tableName: 'buyers' | 'campaigns' | 'companies' | 'developments'
  onComplete?: () => void
  onClose?: () => void
}

// Column mapping configurations for different tables
const COLUMN_MAPPINGS: Record<string, Record<string, string[]>> = {
  buyers: {
    full_name: ['full_name', 'name', 'lead name', 'full name', 'buyer name', 'client name'],
    first_name: ['first_name', 'first name', 'firstname'],
    last_name: ['last_name', 'last name', 'lastname', 'surname'],
    email: ['email', 'e-mail', 'email address'],
    phone: ['phone', 'phone number', 'mobile', 'tel', 'telephone', 'contact number'],
    budget: ['budget', 'budget range', 'price range'],
    budget_min: ['budget_min', 'min budget', 'minimum budget', 'budget from'],
    budget_max: ['budget_max', 'max budget', 'maximum budget', 'budget to'],
    bedrooms: ['bedrooms', 'beds', 'preferred bedrooms', 'no of beds'],
    location: ['location', 'preferred location', 'area', 'region'],
    country: ['country', 'nationality'],
    timeline: ['timeline', 'timeline to purchase', 'purchase timeline', 'when'],
    source: ['source', 'source platform', 'lead source', 'channel'],
    campaign: ['campaign', 'development', 'project', 'property'],
    status: ['status', 'lead status'],
    payment_method: ['payment_method', 'cash or mortgage', 'payment type', 'finance'],
    proof_of_funds: ['proof_of_funds', 'pof', 'proof of funds'],
    notes: ['notes', 'comments', 'remarks'],
    purpose: ['purpose', 'purchase purpose', 'intent'],
  },
  campaigns: {
    name: ['name', 'campaign name', 'campaign'],
    development: ['development', 'project', 'property'],
    client: ['client', 'client name', 'developer'],
    status: ['status', 'campaign status'],
    'total spend': ['total spend', 'spend', 'ad spend', 'budget spent'],
    'total leads': ['total leads', 'leads', 'lead count'],
  },
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  // Parse CSV properly handling quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim())
  const rows = lines.slice(1).map(parseLine)

  return { headers, rows }
}

function mapColumns(headers: string[], row: string[], tableName: string): Record<string, any> {
  const mappings = COLUMN_MAPPINGS[tableName] || {}
  const result: Record<string, any> = {}

  // Create a reverse lookup: csv header -> db column
  const headerToColumn: Record<string, string> = {}
  for (const [dbCol, csvHeaders] of Object.entries(mappings)) {
    for (const csvHeader of csvHeaders) {
      headerToColumn[csvHeader.toLowerCase()] = dbCol
    }
  }

  headers.forEach((header, index) => {
    const dbColumn = headerToColumn[header] || header.replace(/\s+/g, '_').toLowerCase()
    const value = row[index]

    if (value !== undefined && value !== '') {
      // Convert boolean-like values
      if (['true', 'yes', '1'].includes(value.toLowerCase())) {
        result[dbColumn] = true
      } else if (['false', 'no', '0'].includes(value.toLowerCase())) {
        result[dbColumn] = false
      } else if (!isNaN(Number(value)) && dbColumn.includes('_min') || dbColumn.includes('_max') || dbColumn === 'bedrooms') {
        result[dbColumn] = Number(value)
      } else {
        result[dbColumn] = value
      }
    }
  })

  // Build full_name from first_name + last_name if not present
  if (!result.full_name && (result.first_name || result.last_name)) {
    result.full_name = `${result.first_name || ''} ${result.last_name || ''}`.trim()
  }

  return result
}

export function CSVImport({ tableName, onComplete, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setFile(selectedFile)

    try {
      const text = await selectedFile.text()
      const parsed = parseCSV(text)
      setPreview(parsed)
    } catch (err) {
      toast.error('Failed to parse CSV file')
      console.error(err)
    }
  }

  const handleImport = async () => {
    if (!preview || !isSupabaseConfigured()) {
      toast.error('Unable to import data')
      return
    }

    setImporting(true)
    setProgress({ done: 0, total: preview.rows.length, errors: 0 })

    const supabase = createClient()
    let successCount = 0
    let errorCount = 0

    // Process in batches of 50
    const batchSize = 50
    for (let i = 0; i < preview.rows.length; i += batchSize) {
      const batch = preview.rows.slice(i, i + batchSize)
      const records = batch.map(row => mapColumns(preview.headers, row, tableName))

      const { error } = await supabase.from(tableName).insert(records)

      if (error) {
        console.error('Batch insert error:', error)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }

      setProgress({ done: i + batch.length, total: preview.rows.length, errors: errorCount })
    }

    setImporting(false)

    if (errorCount === 0) {
      toast.success(`Successfully imported ${successCount} records`)
    } else {
      toast.warning(`Imported ${successCount} records, ${errorCount} failed`)
    }

    // Trigger batch auto-scoring for imported leads (in background)
    if (tableName === 'buyers' && successCount > 0) {
      toast.info('AI is scoring imported leads...', { duration: 3000 })
      // Score leads in background - don't block the UI
      fetch('/api/ai/score-buyer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: successCount }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.scored > 0) {
            toast.success(`AI scored ${result.scored} leads`)
          }
        })
        .catch((err) => console.error('Batch scoring error:', err))
    }

    onComplete?.()
  }

  const tableLabels: Record<string, string> = {
    buyers: 'Leads',
    campaigns: 'Campaigns',
    companies: 'Companies',
    developments: 'Developments',
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import {tableLabels[tableName]}
            </CardTitle>
            <CardDescription>Upload a CSV file to bulk import data</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          {file ? (
            <div className="space-y-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Click to upload CSV</p>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && preview.rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Preview</span>
              <Badge variant="secondary">{preview.rows.length} rows</Badge>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[200px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {preview.headers.slice(0, 6).map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      {preview.headers.length > 6 && (
                        <th className="px-3 py-2 text-left font-medium">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.slice(0, 6).map((cell, j) => (
                          <td key={j} className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate">
                            {cell || '-'}
                          </td>
                        ))}
                        {row.length > 6 && <td className="px-3 py-2">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.rows.length > 5 && (
                <div className="bg-muted/50 px-3 py-1 text-xs text-muted-foreground text-center">
                  ... and {preview.rows.length - 5} more rows
                </div>
              )}
            </div>

            {/* Column mapping info */}
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Column Mapping</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Columns are automatically mapped. Supported: name, email, phone, budget, bedrooms, location, timeline, source, status, etc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Importing...</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            {progress.errors > 0 && (
              <p className="text-xs text-destructive">{progress.errors} errors</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleImport}
            disabled={!preview || preview.rows.length === 0 || importing}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Import {preview?.rows.length || 0} Records
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
