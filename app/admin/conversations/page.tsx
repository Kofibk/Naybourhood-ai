'use client'

import { useMemo, useState } from 'react'
import { useData } from '@/contexts/DataContext'
import { useLeads } from '@/hooks/useLeads'
import { useCompanies } from '@/hooks/useCompanies'
import { ConversationsView } from '@/components/ConversationsView'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Building } from 'lucide-react'

export default function AdminConversationsPage() {
  const { leads, isLoading: leadsLoading } = useLeads()
  const { companies } = useCompanies()
  const { financeLeads, isLoading: dataLoading } = useData()
  const isLoading = leadsLoading || dataLoading
  const [activeTab, setActiveTab] = useState<'buyers' | 'borrowers'>('buyers')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  // Filter leads by company if selected
  const filteredLeads = useMemo(() => {
    if (companyFilter === 'all') return leads
    return leads.filter(lead => lead.company_id === companyFilter)
  }, [leads, companyFilter])

  // Filter borrowers by company if selected
  const filteredBorrowers = useMemo(() => {
    if (companyFilter === 'all') return financeLeads
    return financeLeads.filter(lead => lead.company_id === companyFilter)
  }, [financeLeads, companyFilter])

  // Get companies for filter dropdown
  const companyOptions = useMemo(() => {
    return companies.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [companies])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">All Conversations</h2>
          <p className="text-sm text-muted-foreground">
            Manage communications across all companies
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Building className="h-4 w-4 text-muted-foreground" />
          <select
            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="all">All Companies</option>
            {companyOptions.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs for Buyers vs Borrowers */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buyers' | 'borrowers')}>
        <TabsList>
          <TabsTrigger value="buyers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Buyers ({filteredLeads.length})
          </TabsTrigger>
          <TabsTrigger value="borrowers" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Borrowers ({filteredBorrowers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buyers" className="mt-4">
          <ConversationsView
            leads={filteredLeads}
            source="leads"
            isLoading={isLoading}
            basePath="/admin"
            title=""
            subtitle=""
            emptyMessage="No buyer conversations yet"
          />
        </TabsContent>

        <TabsContent value="borrowers" className="mt-4">
          <ConversationsView
            borrowers={filteredBorrowers}
            source="borrowers"
            isLoading={isLoading}
            basePath="/admin"
            title=""
            subtitle=""
            emptyMessage="No borrower conversations yet"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
