'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { X, Mail, Loader2, CheckCircle } from 'lucide-react'

interface EmailVerificationBannerProps {
  email: string
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleResend = async () => {
    setIsResending(true)
    const supabase = createClient()

    try {
      await supabase.auth.resend({
        type: 'signup',
        email,
      })
      setResent(true)
      // Reset resent state after 5 seconds
      setTimeout(() => setResent(false), 5000)
    } catch (error) {
      console.error('Failed to resend verification email:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-amber-500" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-medium text-amber-500">Verify your email</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a verification link to <strong className="text-foreground">{email}</strong>
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={isResending || resent}
              className="p-0 h-auto text-amber-500 hover:text-amber-400 mt-1"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" aria-hidden="true" />
                  Sending...
                </>
              ) : resent ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                  Email sent!
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Dismiss email verification banner"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default EmailVerificationBanner
