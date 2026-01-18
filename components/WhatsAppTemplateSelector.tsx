'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageCircle, Send, FileText, Edit2, Sparkles, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { WHATSAPP_TEMPLATES, STAGES, type Stage } from '@/lib/templates/messages'

interface WhatsAppTemplate {
  id: string
  name: string
  body: string
  stage: string
  placeholders: string[]
}

interface WhatsAppTemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientPhone: string
  recipientName: string
  leadStage?: string
  developmentName?: string
  agentName?: string
  companyName?: string
}

export function WhatsAppTemplateSelector({
  open,
  onOpenChange,
  recipientPhone,
  recipientName,
  leadStage = 'Contact Pending',
  developmentName = '',
  agentName = '',
  companyName = 'Naybourhood',
}: WhatsAppTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [activeStage, setActiveStage] = useState<string>(leadStage)
  const [message, setMessage] = useState('')
  const [showTemplates, setShowTemplates] = useState(true)
  const [copied, setCopied] = useState(false)

  // Get first name from recipient name
  const firstName = recipientName?.split(' ')[0] || recipientName || 'there'

  // Placeholders for template filling
  const placeholderValues = useMemo(() => ({
    name: firstName,
    development: developmentName || 'the development',
    agent: agentName || 'Your Agent',
    company: companyName,
    date: '[Date TBC]',
    time: '[Time TBC]',
    price: '[Price]',
  }), [firstName, developmentName, agentName, companyName])

  // Group templates by stage
  const templatesByStage = useMemo(() => {
    const grouped: Record<string, WhatsAppTemplate[]> = {}
    WHATSAPP_TEMPLATES.forEach(template => {
      if (!grouped[template.stage]) {
        grouped[template.stage] = []
      }
      grouped[template.stage].push(template as WhatsAppTemplate)
    })
    return grouped
  }, [])

  // Stages that have templates
  const stagesWithTemplates = STAGES.filter(stage =>
    templatesByStage[stage] && templatesByStage[stage].length > 0
  )

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate('')
      setMessage('')
      setShowTemplates(true)
      setCopied(false)
      setActiveStage(leadStage)
    }
  }, [open, leadStage])

  // Fill placeholders in text
  const fillPlaceholders = (text: string): string => {
    let result = text
    for (const [key, value] of Object.entries(placeholderValues)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }

  // Apply template
  const applyTemplate = (template: WhatsAppTemplate) => {
    const processedMessage = fillPlaceholders(template.body)
    setMessage(processedMessage)
    setSelectedTemplate(template.id)
    setShowTemplates(false)
  }

  // Format phone number for WhatsApp link
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9+]/g, '')

    // Handle UK numbers
    if (cleaned.startsWith('0')) {
      cleaned = '44' + cleaned.substring(1)
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }

    return cleaned
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success('Message copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy message')
    }
  }

  const handleOpenWhatsApp = () => {
    const formattedPhone = formatPhoneForWhatsApp(recipientPhone)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
    onOpenChange(false)
  }

  const handleStartFromScratch = () => {
    setMessage('')
    setSelectedTemplate('')
    setShowTemplates(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp {recipientName}
          </DialogTitle>
          <DialogDescription>
            Choose a template or write a custom message
          </DialogDescription>
        </DialogHeader>

        {showTemplates ? (
          <div className="space-y-4">
            {/* Stage Tabs for Templates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Select a Template</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleStartFromScratch}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Write Custom
                </Button>
              </div>

              {/* Current Stage Highlight */}
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Lead Stage:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{leadStage}</Badge>
              </div>

              <Tabs value={activeStage} onValueChange={setActiveStage} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                  {stagesWithTemplates.map((stage) => (
                    <TabsTrigger
                      key={stage}
                      value={stage}
                      className={`text-xs px-2 py-1 ${stage === leadStage ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
                    >
                      {stage}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {stagesWithTemplates.map((stage) => (
                  <TabsContent key={stage} value={stage} className="mt-4">
                    <div className="grid grid-cols-1 gap-3">
                      {(templatesByStage[stage] || []).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className={`p-4 text-left rounded-lg border transition-colors hover:border-green-500 hover:bg-green-50 ${
                            selectedTemplate === template.id ? 'border-green-500 bg-green-50' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{template.name}</span>
                            <Badge className="bg-green-100 text-green-700 text-xs">WhatsApp</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {template.body}
                          </div>
                        </button>
                      ))}
                    </div>
                    {(templatesByStage[stage] || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No templates available for this stage
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Back to Templates */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setShowTemplates(true)}>
                <FileText className="h-4 w-4 mr-1" />
                Choose Different Template
              </Button>
              {selectedTemplate && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Template applied - edit as needed
                </Badge>
              )}
            </div>

            {/* Phone (read-only) */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{recipientPhone}</span>
              <Badge variant="outline">{recipientName}</Badge>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your WhatsApp message..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Placeholder hints */}
            <div className="text-xs text-muted-foreground bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="font-medium mb-1 text-green-800">Tip: You can use these placeholders:</p>
              <div className="flex flex-wrap gap-2">
                {['{{name}}', '{{development}}', '{{agent}}', '{{date}}', '{{time}}', '{{price}}'].map((ph) => (
                  <code key={ph} className="bg-white px-1.5 py-0.5 rounded text-xs border">{ph}</code>
                ))}
              </div>
            </div>

            {/* Character count */}
            <div className="text-xs text-muted-foreground text-right">
              {message.length} characters
            </div>
          </div>
        )}

        {!showTemplates && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyMessage}
              disabled={!message.trim()}
              className="gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Message'}
            </Button>
            <Button
              onClick={handleOpenWhatsApp}
              disabled={!message.trim()}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in WhatsApp
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
