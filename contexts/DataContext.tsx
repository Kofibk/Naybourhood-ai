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
      if (isSupabase) {
        const supabase = createClient()
        console.log('[DataContext] Fetching data from Supabase...')

        // Fetch buyers - don't throw, just log errors
        try {
          const { data: buyersData, error: buyersError } = await supabase
            .from('buyers')
            .select('*')
            .order('created_at', { ascending: false })

          if (buyersError) {
            console.error('[DataContext] Buyers error:', buyersError.message)
            errors.push(`Buyers: ${buyersError.message}`)
          } else if (buyersData) {
            console.log('[DataContext] Fetched buyers:', buyersData.length)
            setLeads(buyersData)
          }
        } catch (e) {
          console.error('[DataContext] Buyers fetch failed:', e)
        }

        // Fetch campaigns
        try {
          const { data: campaignsData, error: campaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })

          if (campaignsError) {
            console.error('[DataContext] Campaigns error:', campaignsError.message)
            errors.push(`Campaigns: ${campaignsError.message}`)
          } else if (campaignsData) {
            console.log('[DataContext] Fetched campaigns:', campaignsData.length)
            setCampaigns(campaignsData)
          }
        } catch (e) {
          console.error('[DataContext] Campaigns fetch failed:', e)
        }

        // Fetch companies
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

        if (errors.length > 0) {
          setError(errors.join('; '))
        }

        console.log('[DataContext] Data fetch complete')
      } else {
        console.log('[DataContext] Supabase not configured, using demo data')
        setLeads(demoLeads)
        setCampaigns(demoCampaigns)
        setCompanies(demoCompanies)
      }
    } catch (err) {
      console.error('[DataContext] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
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
