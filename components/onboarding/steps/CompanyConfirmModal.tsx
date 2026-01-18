'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Company } from '@/lib/onboarding'
import { Building2, Loader2, Search } from 'lucide-react'

interface CompanyConfirmModalProps {
  isOpen: boolean
  company: Company | null
  onConfirm: () => void
  onCreateNew: () => void
  onClose: () => void
  isLoading?: boolean
}

export default function CompanyConfirmModal({
  isOpen,
  company,
  onConfirm,
  onCreateNew,
  onClose,
  isLoading = false,
}: CompanyConfirmModalProps) {
  if (!company) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" aria-hidden="true" />
            <DialogTitle className="text-xl">We found a match</DialogTitle>
          </div>
          <DialogDescription>
            Is this your company?
          </DialogDescription>
        </DialogHeader>

        {/* Company Card */}
        <div className="p-4 bg-muted/50 border border-border rounded-xl my-2">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold truncate">{company.name}</h3>
              {company.website && (
                <p className="text-sm text-muted-foreground truncate">
                  {company.website.replace(/^https?:\/\//, '')}
                </p>
              )}
              {company.development_count !== undefined && company.development_count > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {company.development_count} active development{company.development_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <Button onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Joining...
              </>
            ) : (
              'Yes, this is my company'
            )}
          </Button>
          <Button
            onClick={onCreateNew}
            variant="outline"
            disabled={isLoading}
            className="w-full"
          >
            No, create a new company
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          An admin will verify your access before you can view company data
        </p>
      </DialogContent>
    </Dialog>
  )
}
