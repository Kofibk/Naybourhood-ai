'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { FinanceLead } from '@/types'

function mapFinanceLeadRow(f: any): FinanceLead {
  const firstName = f.first_name || f['First Name'] || f['first name'] || ''
  const lastName = f.last_name || f['Last Name'] || f['last name'] || ''
  const combinedName = `${firstName} ${lastName}`.trim()

  return {
    ...f,
    id: f.id,
    full_name: f.full_name || f['Full Name'] || combinedName || f['Name'] || f.name || 'Unknown',
    first_name: firstName,
    last_name: lastName,
    email: f.email || f['Email'],
    phone: f.phone || f['Phone'] || f['Phone Number'],
    finance_type: f.finance_type || f['Finance Type'],
    loan_amount: f.loan_amount || f['Loan Amount'] || 0,
    loan_amount_display: f.loan_amount_display || f['Loan Amount Display'],
    required_by_date: f.required_by_date || f['Required By Date'] || f['required_by'],
    message: f.message || f['Message'],
    status: f.status || f['Status'] || 'Contact Pending',
    notes: f.notes || f['Notes'],
    assigned_agent: f.assigned_agent || f['Assigned Agent'],
    date_added: f.date_added || f['Date Added'],
    created_at: f.created_at || f['Created At'],
    updated_at: f.updated_at,
  }
}

async function fetchFinanceLeads(): Promise<FinanceLead[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('borrowers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useFinanceLeads] Fetch error:', error.message)
    throw new Error(`Failed to fetch borrowers: ${error.message}`)
  }
  return (data || []).map(mapFinanceLeadRow)
}

export function useFinanceLeads() {
  const queryClient = useQueryClient()

  const { data: financeLeads = [], isLoading, error, refetch } = useQuery<FinanceLead[], Error>({
    queryKey: ['financeLeads'],
    queryFn: fetchFinanceLeads,
  })

  const updateFinanceLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceLead> }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const excludeColumns = ['id', 'created_at']
      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) cleanData[key] = value
      }
      cleanData.updated_at = new Date().toISOString()

      const { data: updatedData, error } = await supabase
        .from('borrowers').update(cleanData).eq('id', id).select().single()
      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: ({ id, updatedData }) => {
      const mapped = mapFinanceLeadRow(updatedData)
      queryClient.setQueryData<FinanceLead[]>(['financeLeads'], (old) =>
        old?.map((f) => (f.id === id ? mapped : f)) ?? []
      )
      toast.success('Borrower updated')
    },
    onError: (error: any) => {
      console.error('[useFinanceLeads] Update error:', error)
      toast.error('Failed to update borrower', { description: error.message })
    },
  })

  const updateFinanceLead = async (id: string, data: Partial<FinanceLead>): Promise<FinanceLead | null> => {
    try { const r = await updateFinanceLeadMutation.mutateAsync({ id, data }); return r.updatedData } catch { return null }
  }

  return { financeLeads, isLoading, error: error?.message ?? null, refreshFinanceLeads: refetch, updateFinanceLead }
}
