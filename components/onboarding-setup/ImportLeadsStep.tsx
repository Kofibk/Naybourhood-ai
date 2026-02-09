'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react'

interface ImportLeadsStepProps {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isSaving: boolean
}

export function ImportLeadsStep({
  onNext,
  onBack,
  onSkip,
  isSaving,
}: ImportLeadsStepProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
    }
  }

  const handleImport = () => {
    // In production, this would parse the CSV and upsert into buyers table.
    // For the onboarding flow, we mark the step complete.
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Import Leads</h2>
        <p className="text-white/60 text-sm mt-1">
          Upload a CSV file with your existing leads, or skip and add them
          later.
        </p>
      </div>

      <div
        className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {csvFile ? (
          <div className="space-y-2">
            <FileSpreadsheet className="h-10 w-10 mx-auto text-[#34D399]" />
            <p className="text-white font-medium">{csvFile.name}</p>
            <p className="text-white/50 text-sm">
              {(csvFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-10 w-10 mx-auto text-white/40" />
            <p className="text-white/70">Click to upload a CSV file</p>
            <p className="text-white/40 text-sm">
              Columns: name, email, phone, budget, location
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-white/50 hover:text-white/80 underline underline-offset-4"
          >
            Skip this step
          </button>
        </div>

        <Button onClick={handleImport} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : csvFile ? (
            'Import & Continue'
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}
