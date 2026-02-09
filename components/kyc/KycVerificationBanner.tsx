'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useKycCheck } from '@/hooks/useKycCheck'
import type { KycStatus } from '@/types'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  Clock,
} from 'lucide-react'

interface KycVerificationBannerProps {
  buyerId: string
  className?: string
}

interface StatusConfig {
  icon: typeof Shield
  iconColor: string
  bgColor: string
  borderColor: string
  title: string
  description: string
  badgeVariant: string
  badgeLabel: string
  badgeClass: string
}

const STATUS_CONFIG: Record<KycStatus, StatusConfig> = {
  not_started: {
    icon: ShieldQuestion,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-muted',
    title: 'This buyer has not been verified yet',
    description: 'Run AML/KYC verification to confirm buyer identity and compliance.',
    badgeVariant: 'outline',
    badgeLabel: 'Not Verified',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  pending: {
    icon: Clock,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    title: 'Verification in progress...',
    description: 'Checkboard is processing this buyer. Results will appear automatically.',
    badgeVariant: 'outline',
    badgeLabel: 'Pending',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  passed: {
    icon: ShieldCheck,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    title: 'Buyer Verified',
    description: 'AML/KYC checks passed. This buyer has been verified successfully.',
    badgeVariant: 'outline',
    badgeLabel: 'Verified',
    badgeClass: 'bg-green-100 text-green-700 border-green-300',
  },
  failed: {
    icon: ShieldAlert,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    title: 'Verification Failed',
    description: 'AML/KYC checks did not pass. Review the details below.',
    badgeVariant: 'outline',
    badgeLabel: 'Failed',
    badgeClass: 'bg-red-100 text-red-700 border-red-300',
  },
  review: {
    icon: ShieldQuestion,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    title: 'Manual Review Required',
    description: 'Verification flagged for review. Check result details for more info.',
    badgeVariant: 'outline',
    badgeLabel: 'In Review',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  not_available: {
    icon: Shield,
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    borderColor: 'border-muted',
    title: 'Verification Coming Soon',
    description: 'AML/KYC verification will be available once the service is configured.',
    badgeVariant: 'outline',
    badgeLabel: 'Not Available',
    badgeClass: 'bg-gray-100 text-gray-500 border-gray-300',
  },
}

export function KycVerificationBanner({ buyerId, className }: KycVerificationBannerProps) {
  const { kycCheck, initiateCheck, isInitiating } = useKycCheck(buyerId)

  const status: KycStatus = kycCheck?.status ?? 'not_started'
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  const showVerifyButton = status === 'not_started' || status === 'not_available'
  const isComingSoon = status === 'not_available'

  return (
    <Card className={`${config.borderColor} ${config.bgColor} ${className ?? ''}`}>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            {status === 'pending' ? (
              <Loader2 className={`h-6 w-6 mt-0.5 animate-spin ${config.iconColor}`} />
            ) : (
              <Icon className={`h-6 w-6 mt-0.5 ${config.iconColor}`} />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{config.title}</span>
                <KycStatusBadge status={status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              {status === 'failed' && kycCheck?.result_data && (
                <div className="mt-2 text-xs text-red-600">
                  {typeof kycCheck.result_data === 'object' && 'reason' in kycCheck.result_data
                    ? String(kycCheck.result_data.reason)
                    : 'Contact support for details.'}
                </div>
              )}
            </div>
          </div>
          {showVerifyButton && (
            <Button
              size="sm"
              variant={isComingSoon ? 'outline' : 'default'}
              disabled={isComingSoon || isInitiating}
              onClick={() => initiateCheck('both')}
              className="whitespace-nowrap"
            >
              {isInitiating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {isComingSoon
                ? 'Verification Coming Soon'
                : isInitiating
                  ? 'Initiating...'
                  : 'Verify This Buyer'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Reusable badge for use in both the banner and the lead detail header
export function KycStatusBadge({ status, className }: { status: KycStatus; className?: string }) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant="outline"
      className={`text-[10px] ${config.badgeClass} ${className ?? ''}`}
    >
      {config.badgeLabel}
    </Badge>
  )
}
