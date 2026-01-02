'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isAirtableConfigured } from '@/lib/airtable'
import { demoLeads, demoCampaigns, demoCompanies } from '@/lib/demoData'
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
  const [leads, setLeads] = useState<Buyer[]>(demoLeads)
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns)
  const [companies, setCompanies] = useState<Company[]>(demoCompanies)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupabase = isSupabaseConfigured()
  const isAirtable = isAirtableConfigured()

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (isSupabase) {
        const supabase = createClient()

        // Fetch buyers
        const { data: buyersData, error: buyersError } = await supabase
          .from('buyers')
          .select('*')
          .order('created_at', { ascending: false })

        if (buyersError) throw buyersError
        if (buyersData) setLeads(buyersData)

        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false })

        if (campaignsError) throw campaignsError
        if (campaignsData) setCampaigns(campaignsData)

        // Fetch companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('name', { ascending: true })

        if (companiesError) throw companiesError
        if (companiesData) setCompanies(companiesData)
      } else {
        // Use demo data
        setLeads(demoLeads)
        setCampaigns(demoCampaigns)
        setCompanies(demoCompanies)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      // Fallback to demo data
      setLeads(demoLeads)
      setCampaigns(demoCampaigns)
      setCompanies(demoCompanies)
    } finally {
      setIsLoading(false)
    }
  }, [isSupabase])

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
