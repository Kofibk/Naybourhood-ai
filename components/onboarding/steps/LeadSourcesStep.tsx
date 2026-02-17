'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OnboardingFormData, generateApiKey } from '@/lib/onboarding'
import {
  ArrowLeft,
  Plug,
  Key,
  Webhook,
  Code,
  MessageCircle,
  Copy,
  Check,
  Loader2,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadSourcesStepProps {
  data: OnboardingFormData
  companyId: string | null
  onNext: () => void
  onBack: () => void
  isSaving: boolean
}

export default function LeadSourcesStep({
  data,
  companyId,
  onNext,
  onBack,
  isSaving,
}: LeadSourcesStepProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const webhookUrl = companyId
    ? `https://api.naybourhood.ai/v1/leads/ingest/${companyId}`
    : 'https://api.naybourhood.ai/v1/leads/ingest/[company-id]'

  const embedCode = `<script src="https://cdn.naybourhood.ai/form.js" data-company="${companyId || '[company-id]'}"></script>`

  const handleGenerateApiKey = async () => {
    if (!companyId) return

    setIsGenerating(true)
    try {
      const key = await generateApiKey(companyId)
      if (key) {
        setApiKey(key)
      }
    } catch {
      // Error handled in generateApiKey
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} disabled={isSaving} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Plug className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Connect Lead Sources
        </h1>
        <p className="text-muted-foreground">
          Set up integrations to automatically capture and score leads
        </p>
      </div>

      <div className="space-y-4">
        {/* API Key */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">API Key</h3>
              <p className="text-xs text-muted-foreground">For CRM integration</p>
            </div>
          </div>

          {apiKey ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 truncate">
                {apiKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey, 'api')}
              >
                {copiedField === 'api' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleGenerateApiKey}
              disabled={isGenerating || !companyId}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Generate API Key
                </>
              )}
            </Button>
          )}
        </div>

        {/* Webhook URL */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Webhook className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Meta Lead Ads Webhook</h3>
              <p className="text-xs text-muted-foreground">Capture Facebook/Instagram leads</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono text-blue-400 truncate">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(webhookUrl, 'webhook')}
            >
              {copiedField === 'webhook' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Website Form Embed */}
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Website Form Embed</h3>
              <p className="text-xs text-muted-foreground">Add to your website to capture leads</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono text-purple-400 truncate">
              {embedCode}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(embedCode, 'embed')}
            >
              {copiedField === 'embed' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* WhatsApp - Coming Soon */}
        <div className="p-4 bg-card border border-border rounded-xl opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">WhatsApp Business</h3>
              <p className="text-xs text-muted-foreground">Capture leads from WhatsApp</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              Coming soon
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onNext} disabled={isSaving}>
          Skip for now
        </Button>
        <Button onClick={onNext} disabled={isSaving} size="lg">
          Continue
        </Button>
      </div>
    </div>
  )
}
