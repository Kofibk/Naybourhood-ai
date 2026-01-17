'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Megaphone } from 'lucide-react'

export default function CampaignsPage() {
  const { campaigns } = useData()
  const { user } = useAuth()

  // Filter campaigns by company_id - strict filtering for multi-tenant
  const myCampaigns = useMemo(() => {
    if (!user?.company_id) {
      return []
    }
    return campaigns.filter(c => c.company_id === user.company_id)
  }, [campaigns, user?.company_id])

  const stats = useMemo(() => ({
    total: myCampaigns.length,
    active: myCampaigns.filter(c => c.status === 'active').length,
    totalSpend: myCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0),
  }), [myCampaigns])

  if (!user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaigns</h2>
          <p className="text-sm text-muted-foreground">View your marketing campaigns</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your account is not linked to a company.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact an administrator to assign you to a company.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Campaigns</h2>
        <p className="text-sm text-muted-foreground">
          {stats.active} active campaigns • {formatCurrency(stats.totalSpend)} total spend
        </p>
      </div>

      <div className="space-y-4">
        {myCampaigns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No campaigns found.
            </CardContent>
          </Card>
        ) : (
          myCampaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge variant={campaign.status === 'active' ? 'success' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.platform} • {campaign.client || campaign.development}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{formatCurrency(campaign.spend || 0)}</div>
                      <div className="text-xs text-muted-foreground">Spend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{campaign.leads || 0}</div>
                      <div className="text-xs text-muted-foreground">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="text-lg font-semibold">£{campaign.cpl || 0}</span>
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
          ))
        )}
      </div>
    </div>
  )
}
