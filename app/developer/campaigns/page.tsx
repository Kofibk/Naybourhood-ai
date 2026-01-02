'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Lock } from 'lucide-react'

export default function CampaignsPage() {
  const { campaigns } = useData()

  // Check subscription tier (demo - would come from context/API)
  const hasCampaignAccess = true // Growth or Enterprise tier

  if (!hasCampaignAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            View your marketing campaigns
          </p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Campaign Access Locked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Growth or Enterprise to access campaign management
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">Campaigns</h2>
        <p className="text-sm text-muted-foreground">
          View your active marketing campaigns
        </p>
      </div>

      {/* Campaigns */}
      <div className="space-y-4">
        {campaigns.slice(0, 3).map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <Badge
                      variant={campaign.status === 'active' ? 'success' : 'secondary'}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.platform} • {campaign.client}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatCurrency(campaign.spend || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{campaign.leads || 0}</div>
                    <div className="text-xs text-muted-foreground">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-lg font-semibold">
                        £{campaign.cpl || 0}
                      </span>
                      {(campaign.cpl || 0) < 50 ? (
                        <TrendingDown className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">CPL</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
