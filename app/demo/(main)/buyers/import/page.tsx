'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  ArrowLeft,
  Download,
  Sparkles,
} from 'lucide-react'

export default function DemoBuyersImportPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'complete'>('upload')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/Mountanvildemo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Buyers
        </Link>
        <h2 className="text-2xl font-bold text-white">Import Buyers</h2>
        <p className="text-sm text-white/50">Upload a CSV file to import and auto-score your buyer leads</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {['Upload CSV', 'Map Fields', 'Import & Score'].map((label, i) => {
          const stepKeys = ['upload', 'mapping', 'complete'] as const
          const isActive = stepKeys.indexOf(step) >= i
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isActive ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
              }`}>
                {isActive && i < stepKeys.indexOf(step) ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${isActive ? 'text-white' : 'text-white/40'}`}>{label}</span>
              {i < 2 && <div className={`w-12 h-px ${isActive ? 'bg-emerald-500' : 'bg-white/10'}`} />}
            </div>
          )
        })}
      </div>

      {step === 'upload' && (
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="pt-6">
            <div
              className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-emerald-500/50 transition-colors cursor-pointer"
              onClick={() => setStep('mapping')}
            >
              <Upload className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Drop your CSV file here</h3>
              <p className="text-sm text-white/40 mb-4">or click to browse</p>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Select CSV File
              </Button>
              <p className="text-xs text-white/30 mt-4">Supported columns: Name, Email, Phone, Budget, Development, Timeline, Source</p>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
              <Download className="h-4 w-4 text-emerald-400" />
              <button className="text-sm text-emerald-400 hover:underline">Download template CSV</button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <Card className="bg-[#111111] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Map CSV Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">mount_anvil_leads_feb2026.csv</p>
                <p className="text-xs text-white/50">247 rows detected · 12 columns</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { csv: 'Full Name', mapped: 'full_name', auto: true },
                { csv: 'Email Address', mapped: 'email', auto: true },
                { csv: 'Phone', mapped: 'phone', auto: true },
                { csv: 'Budget Range', mapped: 'budget_range', auto: true },
                { csv: 'Interested Development', mapped: 'development_name', auto: true },
                { csv: 'Lead Source', mapped: 'source_platform', auto: true },
                { csv: 'Timeline', mapped: 'timeline_to_purchase', auto: true },
                { csv: 'Country', mapped: 'country', auto: true },
              ].map((field) => (
                <div key={field.csv} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-sm text-white/70">{field.csv}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px]">{field.mapped}</Badge>
                    {field.auto && <span className="text-[10px] text-emerald-400">Auto-mapped</span>}
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={() => setStep('complete')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Import & Score 247 Leads
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3>
            <p className="text-sm text-white/50 mb-1">247 buyers imported successfully</p>
            <p className="text-sm text-white/50 mb-6">AI scoring in progress — leads will be classified within 30 seconds</p>

            <div className="flex items-center justify-center gap-3">
              <div className="bg-white/5 rounded-lg px-4 py-3">
                <p className="text-2xl font-bold text-emerald-400">247</p>
                <p className="text-xs text-white/40">Imported</p>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-3">
                <p className="text-2xl font-bold text-orange-400">31</p>
                <p className="text-xs text-white/40">Hot Leads</p>
              </div>
              <div className="bg-white/5 rounded-lg px-4 py-3">
                <p className="text-2xl font-bold text-blue-400">72</p>
                <p className="text-xs text-white/40">Avg Score</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <Link href="/Mountanvildemo/buyers">
                <Button className="bg-emerald-500 hover:bg-emerald-600">View All Buyers</Button>
              </Link>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5" onClick={() => setStep('upload')}>
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
