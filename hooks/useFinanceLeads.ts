'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { FinanceLead } from '@/types'

// Explicit columns for borrowers table - no select('*')
const BORROWERS_COLUMNS = [
  'id', 'full_name', 'first_name', 'last_name', 'email', 'phone',
  'finance_type', 'loan_amount', 'loan_amount_display',
  'required_by_date', 'message', 'status', 'notes',
  'assigned_agent', 'company_id',
  'date_added', 'created_at', 'updated_at',
].join(', ')

export interface UseFinanceLeadsOptions {
  page?: number
  limit?: number
  companyId?: string
  status?: string
}

function mapFinanceLeadRow(f: Record<string, any>): FinanceLead {
  const firstName = f.first_name || ''
  const lastName = f.last_name || ''
  const combinedName = `${firstName} ${lastName}`.trim()

  return {
    ...f,
    id: f.id,
    full_name: f.full_name || combinedName || 'Unknown',
    first_name: firstName,
    last_name: lastName,
    email: f.email,
    phone: f.phone,
    finance_type: f.finance_type,
    loan_amount: f.loan_amount || 0,
    loan_amount_display: f.loan_amount_display,
    required_by_date: f.required_by_date,
    message: f.message,
    status: f.status || 'Contact Pending',
    notes: f.notes,
    assigned_agent: f.assigned_agent,
    date_added: f.date_added,
    created_at: f.created_at,
    updated_at: f.updated_at,
  }
}

async function fetchFinanceLeads(
  options: UseFinanceLeadsOptions
): Promise<{ data: FinanceLead[]; totalCount: number }> {
  if (!isSupabaseConfigured()) return { data: [], totalCount: 0 }
  const supabase = createClient()
  if (!supabase) return { data: [], totalCount: 0 }

  const { page = 0, limit = 50, companyId, status } = options
  const from = page * limit
  const to = from + limit - 1

  let query = supabase
    .from('borrowers')
    .select(BORROWERS_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[useFinanceLeads] Fetch error:', error.message)
    throw new Error(`Failed to fetch borrowers: ${error.message}`)
  }

  return {
    data: (data || []).map(mapFinanceLeadRow),
    totalCount: count ?? 0,
  }
}

export function useFinanceLeads(options: UseFinanceLeadsOptions = {}) {
  const queryClient = useQueryClient()

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['financeLeads', options],
    queryFn: () => fetchFinanceLeads(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const financeLeads = result?.data ?? []
  const totalCount = result?.totalCount ?? 0

  const updateFinanceLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceLead> }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const excludeColumns = ['id', 'created_at', 'airtable_id']
      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) cleanData[key] = value
      }
      cleanData.updated_at = new Date().toISOString()

      const { data: updatedData, error } = await supabase
        .from('borrowers').update(cleanData).eq('id', id).select(BORROWERS_COLUMNS).single()

      if (error) {
        console.error('[useFinanceLeads] Supabase update failed:', {
          id, code: error.code, message: error.message,
          details: error.details, hint: error.hint,
        })
        throw error
      }

      if (!updatedData) {
        throw new Error(`No data returned after updating borrower ${id}. The record may not exist.`)
      }

      return { id, updatedData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeLeads'] })
      toast.success('Borrower updated')
    },
    onError: (error: any) => {
      console.error('[useFinanceLeads] Update error:', error?.message || error)
      toast.error('Failed to update borrower', { description: error?.message || 'Unknown error' })
    },
  })

  const updateFinanceLead = async (id: string, data: Partial<FinanceLead>): Promise<FinanceLead | null> => {
    try {
      const r = await updateFinanceLeadMutation.mutateAsync({ id, data })
      return r.updatedData
    } catch (error) {
      console.error('[useFinanceLeads] updateFinanceLead failed for id:', id, error)
      return null
    }
  }

  return {
    financeLeads,
    totalCount,
    isLoading,
    error: error?.message ?? null,
    refreshFinanceLeads: refetch,
    updateFinanceLead,
  }
}
