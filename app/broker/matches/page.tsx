'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Heart, Phone, Mail, FileText, MapPin, Users } from 'lucide-react'

export default function MatchesPage() {
  const { financeLeads, isLoading } = useFinanceLeads()
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)

  // Fetch company_id from localStorage or user_profiles
  useEffect(() => {
    const initializeCompany = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            currentUser = JSON.parse(stored)
          }
        } catch { /* ignore */ }
      }

      if (!currentUser?.id) {
        setIsReady(true)
        return
      }

      if (currentUser.company_id) {
        setCompanyId(currentUser.company_id)
        setIsReady(true)
        return
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      }

      setIsReady(true)
    }

    initializeCompany()
  }, [user])

  // Filter borrowers by company_id first
  const myBorrowers = useMemo(() => {
    if (!companyId) return []
    return financeLeads.filter(lead => lead.company_id === companyId)
  }, [financeLeads, companyId])

  // Get top matches (highest loan amounts from borrowers)
  const matches = useMemo(() => {
    return [...myBorrowers]
      .sort((a, b) => (b.loan_amount || 0) - (a.loan_amount || 0))
      .slice(0, 4)
  }, [myBorrowers])

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">My Matches</h2>
          <p className="text-sm text-muted-foreground">Borrowers matched to your services</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your account is not linked to a company.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact an administrator to assign you to a company.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">My Matches</h2>
        <p className="text-sm text-muted-foreground">Borrowers matched to your services</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {matches.map((borrower) => (
          <Card key={borrower.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{borrower.full_name || `${borrower.first_name || ''} ${borrower.last_name || ''}`.trim() || 'Unknown'}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {borrower.finance_type || 'Finance'}
                    </div>
                  </div>
                </div>
                <Badge variant="success">{borrower.status || 'New'}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Loan Amount</div>
                  <div className="font-medium text-sm">{borrower.loan_amount_display || (borrower.loan_amount ? `£${(borrower.loan_amount / 1000).toFixed(0)}k` : 'N/A')}</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Required By</div>
                  <div className="font-medium text-sm">{borrower.required_by_date ? new Date(borrower.required_by_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
