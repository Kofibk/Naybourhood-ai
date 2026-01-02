'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import {
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Eye,
  Flame,
} from 'lucide-react'

export default function LeadsPage() {
  const { leads, isLoading } = useData()
  const [search, setSearch] = useState('')

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 85) return 'text-orange-500'
    if (score >= 70) return 'text-success'
    if (score >= 50) return 'text-warning'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {leads.length.toLocaleString()} total leads
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Lead
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Budget
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Source
                  </th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {(lead.quality_score || 0) >= 85 && (
                            <Flame className="h-4 w-4 text-orange-500" />
                          )}
                          <div>
                            <div className="font-medium">{lead.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {lead.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{lead.budget || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.timeline}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${getScoreColor(
                              lead.quality_score
                            )}`}
                          >
                            Q: {lead.quality_score || 0}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span
                            className={`font-semibold ${getScoreColor(
                              lead.intent_score
                            )}`}
                          >
                            I: {lead.intent_score || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{lead.status || 'New'}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{lead.source}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.campaign}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
