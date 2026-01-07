'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Send, Loader2, FileText, CheckCircle, Edit2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { STAGES, type Stage } from '@/lib/templates/messages'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  stage: string
  placeholders: string[]
}

interface EmailComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientEmail: string
  recipientName: string
  leadId: string
  developmentName?: string
  leadStage?: string // Current lead status to pre-select relevant templates
  agentName?: string
  companyName?: string
  phone?: string
}

export function EmailComposer({
  open,
  onOpenChange,
  recipientEmail,
  recipientName,
  leadId,
  developmentName = '',
  leadStage = 'Contact Pending',
  agentName = '',
  companyName = 'Naybourhood',
  phone = '',
}: EmailComposerProps) {
  const [templatesByStage, setTemplatesByStage] = useState<Record<string, EmailTemplate[]>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [activeStage, setActiveStage] = useState<string>(leadStage)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [emailSent, setEmailSent] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Get first name from recipient name
  const firstName = recipientName?.split(' ')[0] || recipientName || 'there'

  // Placeholders for template filling
  const placeholderValues = useMemo(() => ({
    name: firstName,
    development: developmentName || 'the development',
    agent: agentName || 'Your Agent',
    company: companyName,
    phone: phone || '',
    date: '[Date TBC]',
    time: '[Time TBC]',
    price: '[Price]',
    bedrooms: '[X]',
    location: developmentName || '[Location]',
  }), [firstName, developmentName, agentName, companyName, phone])

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/email/send')
        if (res.ok) {
          const data = await res.json()
          if (data.templatesByStage) {
            setTemplatesByStage(data.templatesByStage)
          }
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err)
      }
    }
    fetchTemplates()
  }, [])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate('')
      setSubject('')
      setBody('')
      setEmailSent(false)
      setIsEditing(false)
      setShowTemplates(true)
      // Set active stage to lead's current stage
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
  const applyTemplate = (template: EmailTemplate) => {
    const processedSubject = fillPlaceholders(template.subject || '')
    const processedBody = fillPlaceholders(template.body)

    setSubject(processedSubject)
    setBody(processedBody)
    setSelectedTemplate(template.id)
    setShowTemplates(false)
    setIsEditing(true) // Allow editing after selecting template
  }

  // Get templates for current stage
  const currentStageTemplates = templatesByStage[activeStage] || []

  // Stages that have templates
  const stagesWithTemplates = STAGES.filter(stage =>
    templatesByStage[stage] && templatesByStage[stage].length > 0
  )

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please enter both subject and message')
      return
    }

    setIsSending(true)

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject.trim(),
          message: body.trim(),
          leadId,
          templateType: selectedTemplate || 'custom',
        }),
      })

      const data = await res.json()

      if (data.success) {
        setEmailSent(true)
        toast.success(data.devMode ? 'Email logged (configure RESEND_API_KEY to send)' : 'Email sent successfully')

        // Close after showing success
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to send email')
      }
    } catch (err) {
      console.error('Send email error:', err)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  const handleStartFromScratch = () => {
    setSubject('')
    setBody('')
    setSelectedTemplate('')
    setShowTemplates(false)
    setIsEditing(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to {recipientName}
          </DialogTitle>
          <DialogDescription>
            Choose a template for the lead&apos;s stage or write a custom message
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Email Sent!</h3>
            <p className="text-muted-foreground">Your email to {recipientName} has been sent.</p>
          </div>
        ) : showTemplates ? (
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
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Lead Stage:</span>
                <Badge variant="outline" className="bg-primary/5">{leadStage}</Badge>
              </div>

              <Tabs value={activeStage} onValueChange={setActiveStage} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                  {stagesWithTemplates.map((stage) => (
                    <TabsTrigger
                      key={stage}
                      value={stage}
                      className={`text-xs px-2 py-1 ${stage === leadStage ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                    >
                      {stage}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {stagesWithTemplates.map((stage) => (
                  <TabsContent key={stage} value={stage} className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(templatesByStage[stage] || []).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className={`p-4 text-left rounded-lg border transition-all hover:border-primary hover:bg-primary/5 ${
                            selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{template.name}</span>
                            <Badge variant="secondary" className="text-xs">Email</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2 truncate">
                            Subject: {template.subject}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {template.body.substring(0, 100)}...
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
                <Badge variant="secondary">
                  Template applied - edit as needed
                </Badge>
              )}
            </div>

            {/* Recipient (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <div className="flex items-center gap-2">
                <Input value={recipientEmail} readOnly className="bg-muted" />
                <Badge variant="outline">{recipientName}</Badge>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={12}
                className="resize-none font-mono text-sm"
              />
            </div>

            {/* Placeholder hints */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-1">Tip: You can use these placeholders:</p>
              <div className="flex flex-wrap gap-2">
                {['{{name}}', '{{development}}', '{{agent}}', '{{company}}', '{{date}}', '{{time}}', '{{price}}'].map((ph) => (
                  <code key={ph} className="bg-background px-1.5 py-0.5 rounded text-xs">{ph}</code>
                ))}
              </div>
            </div>

            {/* Character count */}
            <div className="text-xs text-muted-foreground text-right">
              {body.length} characters
            </div>
          </div>
        )}

        {!emailSent && !showTemplates && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={isSending || !subject.trim() || !body.trim()}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
