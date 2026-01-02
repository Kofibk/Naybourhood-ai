'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Filter, MoreVertical, Building2 } from 'lucide-react'

export default function CompaniesPage() {
  const router = useRouter()
  const { companies, isLoading } = useData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage client companies and partnerships
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search companies..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Companies Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : (
          companies.map((company) => (
            <Card
              key={company.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push(`/admin/companies/${company.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {company.type}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold">
                        {company.campaign_count || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Campaigns</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {company.total_leads || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Leads</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(company.total_spend || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Spend</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge
                    variant={company.status === 'Active' ? 'success' : 'secondary'}
                  >
                    {company.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {company.contact_email}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
