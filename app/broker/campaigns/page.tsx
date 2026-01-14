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

  if (!user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaigns</h2>
          <p className="text-sm text-muted-foreground">View referral campaigns</p>
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
        <p className="text-sm text-muted-foreground">View referral campaigns</p>
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
                    <p className="text-sm text-muted-foreground">{campaign.platform}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{campaign.leads || 0}</div>
                      <div className="text-xs text-muted-foreground">Leads</div>
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
