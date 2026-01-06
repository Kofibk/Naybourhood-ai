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
              <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                  <FileJson className="h-4 w-4" />
                  Leads in File
                </div>
                <div className="text-3xl font-bold text-foreground">{status.fileLeadCount?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to import</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                  <Database className="h-4 w-4" />
                  Leads in Database
                </div>
                <div className="text-3xl font-bold text-foreground">{status.currentDbCount?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently stored</p>
              </div>
            </div>

            {/* Import Mode Selection */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Import Mode</p>
              <div className="space-y-3">
                <button
                  onClick={() => setMode('upsert')}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'upsert'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    mode === 'upsert' ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                  }`}>
                    {mode === 'upsert' && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      Upsert
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update existing leads by email, insert new ones. Safe and non-destructive.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('append')}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'append'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    mode === 'append' ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                  }`}>
                    {mode === 'append' && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Append Only</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only insert new leads, skip duplicates. Keeps all existing data unchanged.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('replace')}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'replace'
                      ? 'border-red-500 bg-red-500/10 shadow-sm'
                      : 'border-red-500/30 hover:border-red-500/60 hover:bg-red-500/5 dark:border-red-500/40'
                  }`}
                >
                  <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    mode === 'replace' ? 'border-red-500 bg-red-500' : 'border-red-500/50'
                  }`}>
                    {mode === 'replace' && <Trash2 className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Replace All
                    </p>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                      DANGER: Deletes ALL existing leads first, then imports new ones.
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
              <div className={`p-5 rounded-xl border-2 ${
                result.success
                  ? 'bg-green-500/10 border-green-500/30 dark:bg-green-500/20'
                  : 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.success ? (
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h4 className={`text-lg font-semibold ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {result.success ? 'Import Successful!' : 'Import Failed'}
                    </h4>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-background/60 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.inserted}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </div>
                  <div className="bg-background/60 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.updated || 0}</p>
                    <p className="text-xs text-muted-foreground">Updated</p>
                  </div>
                  <div className="bg-background/60 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{result.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Mode: <Badge variant="outline" className="ml-1">{result.mode}</Badge>
                  </p>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                    <p className="font-medium text-red-600 dark:text-red-400 text-sm mb-1">Errors:</p>
                    <ul className="list-disc list-inside text-xs text-red-600/80 dark:text-red-400/80 space-y-0.5">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
