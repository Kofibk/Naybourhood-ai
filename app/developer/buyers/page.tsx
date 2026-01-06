'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { EmailComposer } from '@/components/EmailComposer'
import {
  Search, Phone, Mail, MessageCircle, Eye, Flame, Users,
  ChevronRight, Target, TrendingUp, CheckCircle, Clock
} from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
]

const getClassificationColor = (classification: string | undefined) => {
  switch (classification) {
    case 'Hot': return 'bg-red-500 text-white'
    case 'Warm-Qualified': return 'bg-orange-500 text-white'
    case 'Warm-Engaged': return 'bg-amber-500 text-white'
    case 'Nurture': return 'bg-blue-400 text-white'
    case 'Cold': return 'bg-gray-400 text-white'
    default: return 'bg-gray-300 text-gray-700'
  }
}

const getStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'Completed':
    case 'Exchanged': return 'bg-green-100 text-green-800 border-green-300'
    case 'Reserved':
    case 'Negotiating': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'Viewing Booked': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'Follow Up': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'Not Proceeding': return 'bg-red-100 text-red-800 border-red-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export default function DeveloperBuyersPage() {
  const router = useRouter()
  const { leads, isLoading, updateLead } = useData()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classificationFilter, setClassificationFilter] = useState<string>('all')
  const [emailLead, setEmailLead] = useState<any>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Filter leads by company_id - only show leads assigned to the user's company
  // For testing, if company is 'mph-company' show all leads
  const myLeads = useMemo(() => {
    if (!user?.company_id) {
      // For demo/testing - show all leads if no company set
      if (user?.email?.includes('test') || user?.email?.includes('demo')) {
        return leads
      }
      return []
    }
    if (user.company_id === 'mph-company') {
      return leads // Show all for test company
    }
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id, user?.email])

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      const matchesSearch = !search ||
        lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search)

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesClassification = classificationFilter === 'all' ||
        lead.ai_classification === classificationFilter

      return matchesSearch && matchesStatus && matchesClassification
    })
  }, [myLeads, search, statusFilter, classificationFilter])

  // Conversion funnel stats
  const stats = useMemo(() => {
    const total = myLeads.length
    const hot = myLeads.filter(l => l.ai_classification === 'Hot' || (l.ai_quality_score || l.quality_score || 0) >= 70).length
    const viewings = myLeads.filter(l => l.status === 'Viewing Booked').length
    const negotiating = myLeads.filter(l => l.status === 'Negotiating').length
    const reserved = myLeads.filter(l => l.status === 'Reserved' || l.status === 'Exchanged').length
    const completed = myLeads.filter(l => l.status === 'Completed').length
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, hot, viewings, negotiating, reserved, completed, conversionRate }
  }, [myLeads])

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId)
    try {
      await updateLead(leadId, { status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleQuickCall = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`
    } else {
      toast.error('No phone number available')
    }
  }

  const handleQuickEmail = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) {
      setEmailLead(lead)
    } else {
      toast.error('No email address available')
    }
  }

  const handleQuickWhatsApp = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      const phone = lead.phone.replace(/[^0-9]/g, '')
      window.open(`https://wa.me/${phone}`, '_blank')
    } else {
      toast.error('No phone number available')
    }
  }

  if (!user?.company_id && !user?.email?.includes('test') && !user?.email?.includes('demo')) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Lead Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage and convert your leads
          </p>
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Lead Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage and convert your leads to completed sales
        </p>
      </div>

      {/* Conversion Funnel Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Total Leads</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-3 border-red-200 bg-red-50">
          <div className="text-xs text-red-600 flex items-center gap-1">
            <Flame className="h-3 w-3" /> Hot Leads
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.hot}</div>
        </Card>
        <Card className="p-3 border-purple-200 bg-purple-50">
          <div className="text-xs text-purple-600">Viewings</div>
          <div className="text-2xl font-bold text-purple-600">{stats.viewings}</div>
        </Card>
        <Card className="p-3 border-blue-200 bg-blue-50">
          <div className="text-xs text-blue-600">Negotiating</div>
          <div className="text-2xl font-bold text-blue-600">{stats.negotiating}</div>
        </Card>
        <Card className="p-3 border-amber-200 bg-amber-50">
          <div className="text-xs text-amber-600">Reserved</div>
          <div className="text-2xl font-bold text-amber-600">{stats.reserved}</div>
        </Card>
        <Card className="p-3 border-green-200 bg-green-50">
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Completed
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card className="p-3 border-primary/50 bg-primary/5">
          <div className="text-xs text-primary flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Conv. Rate
          </div>
          <div className="text-2xl font-bold text-primary">{stats.conversionRate}%</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          value={classificationFilter}
          onChange={(e) => setClassificationFilter(e.target.value)}
        >
          <option value="all">All Classifications</option>
          <option value="Hot">Hot</option>
          <option value="Warm-Qualified">Warm-Qualified</option>
          <option value="Warm-Engaged">Warm-Engaged</option>
          <option value="Nurture">Nurture</option>
          <option value="Cold">Cold</option>
        </select>
        <select
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Your Leads ({filteredLeads.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-muted rounded" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {myLeads.length === 0 ? 'No leads assigned yet' : 'No leads match your filters'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Lead</th>
                    <th className="pb-2 font-medium">Classification</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Budget</th>
                    <th className="pb-2 font-medium">AI Next Action</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/developer/buyers/${lead.id}`)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-medium flex items-center gap-2">
                          {lead.ai_classification === 'Hot' && <Flame className="h-4 w-4 text-red-500" />}
                          {lead.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Q{lead.ai_quality_score || lead.quality_score || 0}/I{lead.ai_intent_score || lead.intent_score || 0}
                          {lead.email && ` • ${lead.email}`}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={`text-xs ${getClassificationColor(lead.ai_classification)}`}>
                          {lead.ai_classification || 'Unscored'}
                        </Badge>
                      </td>
                      <td className="py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status || 'Contact Pending'}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          disabled={updatingStatus === lead.id}
                          className={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${getStatusColor(lead.status)}`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">{lead.budget || lead.budget_range || '-'}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">
                          {lead.ai_next_action || 'Contact to confirm interest'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {lead.phone && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleQuickCall(lead, e)}
                                title="Call"
                              >
                                <Phone className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleQuickWhatsApp(lead, e)}
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            </>
                          )}
                          {lead.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => handleQuickEmail(lead, e)}
                              title="Email"
                            >
                              <Mail className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/developer/buyers/${lead.id}`)
                            }}
                            title="View Details"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Composer Modal */}
      {emailLead && (
        <EmailComposer
          open={!!emailLead}
          onOpenChange={(open) => !open && setEmailLead(null)}
          recipientEmail={emailLead.email || ''}
          recipientName={emailLead.full_name || 'Lead'}
          leadId={emailLead.id}
          developmentName={emailLead.campaign}
        />
      )}
    </div>
  )
}
