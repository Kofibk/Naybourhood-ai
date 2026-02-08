'use client'

import { BillingPanel } from '@/components/billing/BillingPanel'
import { Toaster } from 'sonner'

export default function DeveloperBillingPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Toaster position="top-center" richColors />
      <div>
        <h1 className="text-2xl font-bold font-display">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and payment details
        </p>
      </div>
      <BillingPanel />
    </div>
  )
}
