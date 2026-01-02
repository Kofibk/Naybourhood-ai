'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Filter, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react'

export default function CampaignsPage() {
  const { campaigns, isLoading } = useData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            Manage and monitor all marketing campaigns
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <Badge
                        variant={campaign.status === 'active' ? 'success' : 'secondary'}
                      >
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline">{campaign.platform}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.client}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {formatCurrency(campaign.spend || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Spend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {campaign.leads || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Leads</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
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
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
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
