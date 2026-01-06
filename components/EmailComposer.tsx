'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Mail, Send, Loader2, FileText, ChevronDown, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

interface EmailComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientEmail: string
  recipientName: string
  leadId: string
  developmentName?: string
}

export function EmailComposer({
  open,
  onOpenChange,
  recipientEmail,
  recipientName,
  leadId,
  developmentName,
}: EmailComposerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/email/send')
        if (res.ok) {
          const data = await res.json()
          setTemplates(data.templates || [])
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
    }
  }, [open])

  // Apply template
  const applyTemplate = (template: EmailTemplate) => {
    // Replace placeholders
    let processedSubject = template.subject
      .replace(/{{name}}/g, recipientName || 'there')
      .replace(/{{development}}/g, developmentName || 'our development')

    let processedBody = template.body
      .replace(/{{name}}/g, recipientName || 'there')
      .replace(/{{development}}/g, developmentName || 'our development')

    setSubject(processedSubject)
    setBody(processedBody)
    setSelectedTemplate(template.id)
    setShowTemplates(false)
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to {recipientName}
          </DialogTitle>
          <DialogDescription>
            Compose and send an email to {recipientEmail}
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Email Sent!</h3>
            <p className="text-muted-foreground">Your email to {recipientName} has been sent.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Use Template</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Templates
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showTemplates && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className={`p-3 text-left rounded-lg border transition-colors hover:bg-muted ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{template.subject}</div>
                    </button>
                  ))}
                </div>
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
                rows={10}
                className="resize-none"
              />
            </div>

            {/* Character count */}
            <div className="text-xs text-muted-foreground text-right">
              {body.length} characters
            </div>
          </div>
        )}

        {!emailSent && (
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
