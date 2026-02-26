'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEMO_TOP_CAMPAIGNS } from '@/lib/demo-data'
import { TrendingUp, TrendingDown } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(amount)
}

export default function DemoCampaignsPage() {
  const campaigns = DEMO_TOP_CAMPAIGNS

  const stats = useMemo(() => ({
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    totalSpend: campaigns.reduce((sum, c) => sum + c.spend, 0),
    totalLeads: campaigns.reduce((sum, c) => sum + c.leads, 0),
  }), [campaigns])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Campaigns</h2>
        <p className="text-sm text-white/50">
          {stats.active} active campaigns · {formatCurrency(stats.totalSpend)} total spend
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/50">Total Campaigns</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/50">Active</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/50">Total Spend</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalSpend)}</div>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-4">
            <div className="text-sm text-white/50">Total Leads</div>
            <div className="text-2xl font-bold text-white">{stats.totalLeads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="bg-[#111111] border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{campaign.name}</h3>
                    <Badge variant={campaign.status === 'active' ? 'success' : campaign.status === 'paused' ? 'warning' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-white/50">
                    {campaign.platform} · {campaign.development}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{formatCurrency(campaign.spend)}</div>
                    <div className="text-xs text-white/40">Spend</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{campaign.leads}</div>
                    <div className="text-xs text-white/40">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-lg font-semibold text-white">
                        £{Math.round(campaign.cpl)}
                      </span>
                      {campaign.cpl < 200 ? (
                        <TrendingDown className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="text-xs text-white/40">CPL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{campaign.ctr}%</div>
                    <div className="text-xs text-white/40">CTR</div>
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
