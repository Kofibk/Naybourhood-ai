'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function CampaignsPage() {
  const { campaigns } = useData()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Campaigns</h2>
        <p className="text-sm text-muted-foreground">View referral campaigns</p>
      </div>

      <div className="space-y-4">
        {campaigns.slice(0, 3).map((campaign) => (
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
        ))}
      </div>
    </div>
  )
}
