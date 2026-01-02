'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isAirtableConfigured, fetchLeads as fetchAirtableLeads, fetchCampaigns as fetchAirtableCampaigns } from '@/lib/airtable'
import type { Buyer, Campaign, Company } from '@/types'

interface DataContextType {
  leads: Buyer[]
  campaigns: Campaign[]
  companies: Company[]
  isLoading: boolean
  error: string | null
  isSupabase: boolean
  isAirtable: boolean
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Buyer[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSupabase = isSupabaseConfigured()
  const isAirtable = isAirtableConfigured()

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const errors: string[] = []

    try {
      // BUYERS: Fetch from Airtable (primary) or Supabase (fallback)
      if (isAirtable) {
        console.log('[DataContext] Fetching buyers from Airtable...')
        try {
          const airtableLeads = await fetchAirtableLeads()
          if (airtableLeads && airtableLeads.length > 0) {
            // Map Airtable fields to our Buyer type
            const mappedLeads: Buyer[] = airtableLeads.map((lead: any) => ({
              id: lead.id,
              full_name: lead.name || lead.full_name || lead.Name,
              first_name: lead.first_name || lead.firstName,
              last_name: lead.last_name || lead.lastName,
              email: lead.email || lead.Email,
              phone: lead.phone || lead.Phone,
              budget: lead.budget || lead.Budget,
              budget_min: lead.budget_min || lead.budgetMin,
              budget_max: lead.budget_max || lead.budgetMax,
              bedrooms: lead.bedrooms || lead.Bedrooms,
              location: lead.location || lead.Location || lead.area,
              area: lead.area || lead.Area,
              timeline: lead.timeline || lead.Timeline,
              source: lead.source || lead.Source,
              campaign: lead.campaign || lead.Campaign,
              campaign_id: lead.campaign_id || lead.campaignId,
              status: lead.status || lead.Status,
              quality_score: lead.qualityScore || lead.quality_score || lead['Quality Score'],
              intent_score: lead.intentScore || lead.intent_score || lead['Intent Score'],
              payment_method: lead.payment_method || lead.paymentMethod,
              proof_of_funds: lead.proof_of_funds || lead.proofOfFunds,
              mortgage_status: lead.mortgage_status || lead.mortgageStatus,
              uk_broker: lead.uk_broker || lead.ukBroker,
              uk_solicitor: lead.uk_solicitor || lead.ukSolicitor,
              notes: lead.notes || lead.Notes,
              created_at: lead.createdAt || lead.created_at || lead.Created,
              updated_at: lead.updatedAt || lead.updated_at,
              last_contact: lead.lastContact || lead.last_contact || lead['Last Contact'],
            }))
            console.log('[DataContext] Fetched buyers from Airtable:', mappedLeads.length)
            setLeads(mappedLeads)
          } else {
            console.log('[DataContext] No buyers in Airtable, trying Supabase...')
            errors.push('No buyers found in Airtable')
          }
        } catch (e) {
          console.error('[DataContext] Airtable buyers fetch failed:', e)
          errors.push(`Airtable Buyers: ${e instanceof Error ? e.message : 'Failed'}`)
        }
      } else if (isSupabase) {
        // Fallback to Supabase for buyers
        console.log('[DataContext] Fetching buyers from Supabase...')
        const supabase = createClient()
        try {
          const allBuyers: Buyer[] = []
          const pageSize = 1000
          let page = 0
          let hasMore = true

          while (hasMore) {
            const from = page * pageSize
            const to = from + pageSize - 1

            const { data: buyersData, error: buyersError } = await supabase
              .from('buyers')
              .select('*')
              .order('created_at', { ascending: false })
              .range(from, to)

            if (buyersError) {
              console.error('[DataContext] Supabase Buyers error:', buyersError.message)
              errors.push(`Supabase Buyers: ${buyersError.message}`)
              hasMore = false
            } else if (buyersData) {
              allBuyers.push(...buyersData)
              console.log(`[DataContext] Fetched buyers page ${page + 1}:`, buyersData.length)
              hasMore = buyersData.length === pageSize
              page++
            } else {
              hasMore = false
            }
          }

          console.log('[DataContext] Total buyers fetched from Supabase:', allBuyers.length)
          setLeads(allBuyers)
        } catch (e) {
          console.error('[DataContext] Supabase Buyers fetch failed:', e)
        }
      }

      // CAMPAIGNS: Fetch from Airtable (primary) or Supabase (fallback)
      if (isAirtable) {
        console.log('[DataContext] Fetching campaigns from Airtable...')
        try {
          const airtableCampaigns = await fetchAirtableCampaigns()
          if (airtableCampaigns && airtableCampaigns.length > 0) {
            // Map Airtable fields to our Campaign type
            const mappedCampaigns: Campaign[] = airtableCampaigns.map((camp: any) => ({
              id: camp.id,
              name: camp.name || camp.Name,
              client: camp.client || camp.Client,
              company_id: camp.company_id || camp.companyId,
              platform: camp.platform || camp.Platform,
              status: camp.status || camp.Status,
              spend: camp.spend || camp.Spend || camp.amount_spent,
              amount_spent: camp.amount_spent || camp.amountSpent,
              leads: camp.leads || camp.Leads || camp.lead_count,
              lead_count: camp.lead_count || camp.leadCount,
              cpl: camp.cpl || camp.CPL || camp.cost_per_lead,
              cost_per_lead: camp.cost_per_lead || camp.costPerLead,
              impressions: camp.impressions || camp.Impressions,
              clicks: camp.clicks || camp.Clicks,
              ctr: camp.ctr || camp.CTR,
              start_date: camp.startDate || camp.start_date || camp['Start Date'],
              end_date: camp.endDate || camp.end_date || camp['End Date'],
              created_at: camp.createdAt || camp.created_at,
              updated_at: camp.updatedAt || camp.updated_at,
            }))
            console.log('[DataContext] Fetched campaigns from Airtable:', mappedCampaigns.length)
            setCampaigns(mappedCampaigns)
          } else {
            console.log('[DataContext] No campaigns in Airtable, trying Supabase...')
            errors.push('No campaigns found in Airtable')
          }
        } catch (e) {
          console.error('[DataContext] Airtable campaigns fetch failed:', e)
          errors.push(`Airtable Campaigns: ${e instanceof Error ? e.message : 'Failed'}`)
        }
      } else if (isSupabase) {
        // Fallback to Supabase for campaigns
        console.log('[DataContext] Fetching campaigns from Supabase...')
        const supabase = createClient()
        try {
          const { data: campaignsData, error: campaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })

          if (campaignsError) {
            console.error('[DataContext] Supabase Campaigns error:', campaignsError.message)
            errors.push(`Supabase Campaigns: ${campaignsError.message}`)
          } else if (campaignsData) {
            console.log('[DataContext] Fetched campaigns from Supabase:', campaignsData.length)
            setCampaigns(campaignsData)
          }
        } catch (e) {
          console.error('[DataContext] Supabase Campaigns fetch failed:', e)
        }
      }

      // COMPANIES: Always from Supabase
      if (isSupabase) {
        console.log('[DataContext] Fetching companies from Supabase...')
        const supabase = createClient()
        try {
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true })

          if (companiesError) {
            console.error('[DataContext] Companies error:', companiesError.message)
            errors.push(`Companies: ${companiesError.message}`)
          } else if (companiesData) {
            console.log('[DataContext] Fetched companies:', companiesData.length)
            setCompanies(companiesData)
          }
        } catch (e) {
          console.error('[DataContext] Companies fetch failed:', e)
        }
      }

      if (errors.length > 0) {
        setError(errors.join('; '))
      }

      console.log('[DataContext] Data fetch complete')
    } catch (err) {
      console.error('[DataContext] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [isSupabase, isAirtable])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return (
    <DataContext.Provider
      value={{
        leads,
        campaigns,
        companies,
        isLoading,
        error,
        isSupabase,
        isAirtable,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
