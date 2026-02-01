'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, Mail, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LogoIcon } from '@/components/Logo'

function ExpiredLinkInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    const reasonParam = searchParams.get('reason')
    if (reasonParam) {
      setReason(reasonParam)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <LogoIcon className="w-14 h-14 mx-auto" variant="light" />
        </div>

        {/* Main Card */}
        <Card>
          <CardContent className="pt-6 pb-6 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="font-display text-2xl font-medium">Link Expired</h1>
              <p className="text-muted-foreground">
                This authentication link has expired or has already been used.
              </p>
            </div>

            {/* Reason (if provided) */}
            {reason && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      {reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                For security reasons, authentication links expire after <strong>1 hour</strong> or after being used once.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full gap-2" 
                onClick={() => router.push('/login')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Need a new link?
                </p>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => router.push('/login?tab=magic')}
                  >
                    <Mail className="w-4 h-4" />
                    Request Magic Link
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const url = new URL(window.location.origin + '/login')
                      url.searchParams.set('forgot', 'true')
                      router.push(url.toString())
                    }}
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Having trouble? Contact support for assistance.
        </p>
      </div>
    </div>
  )
}

export default function ExpiredLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ExpiredLinkInner />
    </Suspense>
  )
}
