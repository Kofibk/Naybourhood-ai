'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database,
  FileJson,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface ImportStatus {
  exists: boolean
  fileLeadCount?: number
  currentDbCount?: number
  sampleLead?: any
  fields?: string[]
  error?: string
}

interface ImportResult {
  success: boolean
  mode: string
  totalLeads: number
  inserted: number
  updated: number
  skipped: number
  errors?: string[]
  message: string
}

export function LeadImporter() {
  const [status, setStatus] = useState<ImportStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [mode, setMode] = useState<'upsert' | 'replace' | 'append'>('upsert')
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/import/leads')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check status:', error)
      setStatus({ exists: false, error: 'Failed to check import status' })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!status?.exists) {
      toast.error('No leads file found')
      return
    }

    if (mode === 'replace') {
      const confirmed = window.confirm(
        `⚠️ REPLACE MODE will DELETE all ${status.currentDbCount} existing leads and import ${status.fileLeadCount} new leads.\n\nAre you absolutely sure?`
      )
      if (!confirmed) return
    }

    setImporting(true)
    setResult(null)

    try {
      const res = await fetch('/api/import/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, batchSize: 50 })
      })

      const data = await res.json()

      if (data.success) {
        setResult(data)
        toast.success(data.message)
        checkStatus() // Refresh counts
      } else {
        toast.error(data.error || 'Import failed')
        setResult(data)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed - check console for details')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Leads
        </CardTitle>
        <CardDescription>
          Import leads from leads_transformed.json into Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : status?.exists ? (
          <>
            {/* File Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileJson className="h-4 w-4" />
                  File Leads
                </div>
                <div className="text-2xl font-bold">{status.fileLeadCount?.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  Current in DB
                </div>
                <div className="text-2xl font-bold">{status.currentDbCount?.toLocaleString()}</div>
              </div>
            </div>

            {/* Import Mode Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Import Mode</p>
              <div className="space-y-2">
                <button
                  onClick={() => setMode('upsert')}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    mode === 'upsert' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'upsert' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {mode === 'upsert' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-medium">Upsert (Recommended)</p>
                    <p className="text-sm text-muted-foreground">
                      Update existing leads by email, insert new ones. Safe and non-destructive.
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setMode('append')}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    mode === 'append' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'append' ? 'border-primary' : 'border-muted-foreground'
                  }`}>
                    {mode === 'append' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-medium">Append Only</p>
                    <p className="text-sm text-muted-foreground">
                      Only insert new leads, skip duplicates. Keeps all existing data unchanged.
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setMode('replace')}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    mode === 'replace' ? 'border-red-500 bg-red-50' : 'border-red-200 hover:bg-red-50'
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                    mode === 'replace' ? 'border-red-500' : 'border-red-300'
                  }`}>
                    {mode === 'replace' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      Replace All
                    </p>
                    <p className="text-sm text-red-600">
                      ⚠️ DANGER: Deletes ALL existing leads first, then imports new ones.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Import Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={importing}
                className={mode === 'replace' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {status.fileLeadCount?.toLocaleString()} Leads
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={checkStatus} disabled={loading || importing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Result */}
            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">{result.message}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p>Mode: <Badge variant="outline">{result.mode}</Badge></p>
                  <p>Processed: {result.inserted} leads</p>
                  {result.skipped > 0 && <p>Skipped: {result.skipped}</p>}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2 text-red-600">
                      <p className="font-medium">Errors:</p>
                      <ul className="list-disc list-inside text-xs">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sample Lead Preview */}
            {status.sampleLead && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Preview sample lead data
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(status.sampleLead, null, 2)}
                </pre>
              </details>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="font-medium mb-2">No leads file found</h3>
            <p className="text-sm text-muted-foreground">
              Place <code className="bg-muted px-1 py-0.5 rounded">leads_transformed.json</code> in the project root
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
