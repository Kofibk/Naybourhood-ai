'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import { Company } from '@/types'
import {
  Plus,
  Search,
  Building2,
  Edit,
  Trash2,
  X,
  Save,
  Mail,
  Phone,
  Globe,
  Users,
  CheckCircle,
  AlertCircle,
  Megaphone,
  Clock,
} from 'lucide-react'

type CompanyStatus = 'Active' | 'Trial' | 'Inactive'

interface EditingCompany {
  id?: string
  name: string
  type: string
  contact_name: string
  contact_email: string
  phone: string
  website: string
  status: CompanyStatus
  tier: 'starter' | 'growth' | 'enterprise'
}

export default function CompaniesPage() {
  const router = useRouter()
  const { companies, leads, campaigns, isLoading, createCompany, updateCompany, deleteCompany } = useData()

  // Compute leads and campaigns per company
  const companiesWithCounts = useMemo(() => {
    return companies.map(company => ({
      ...company,
      total_leads: leads.filter(l => l.company_id === company.id).length,
      campaign_count: campaigns.filter(c => c.company_id === company.id).length,
    }))
  }, [companies, leads, campaigns])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<EditingCompany | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companiesWithCounts.filter((company) => {
      const matchesSearch = !searchQuery ||
        company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || 
        company.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [companiesWithCounts, searchQuery, statusFilter])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      total: companiesWithCounts.length,
      active: companiesWithCounts.filter(c => c.status?.toLowerCase() === 'active').length,
      trial: companiesWithCounts.filter(c => c.status?.toLowerCase() === 'trial').length,
      totalLeads: companiesWithCounts.reduce((sum, c) => sum + (c.total_leads || 0), 0),
    }
  }, [companiesWithCounts])

  const handleCreateCompany = () => {
    setEditingCompany({
      name: '',
      type: 'Developer',
      contact_name: '',
      contact_email: '',
      phone: '',
      website: '',
      status: 'Active',
      tier: 'starter',
    })
    setIsModalOpen(true)
    setMessage(null)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany({
      id: company.id,
      name: company.name || '',
      type: company.type || 'Developer',
      contact_name: company.contact_name || '',
      contact_email: company.contact_email || '',
      phone: company.phone || '',
      website: company.website || '',
      status: (company.status as EditingCompany['status']) || 'Active',
      tier: (company.tier as EditingCompany['tier']) || 'starter',
    })
    setIsModalOpen(true)
    setMessage(null)
  }

  const handleSaveCompany = async () => {
    if (!editingCompany) return

    setIsSaving(true)
    try {
      const companyData = {
        name: editingCompany.name,
        type: editingCompany.type,
        contact_name: editingCompany.contact_name,
        contact_email: editingCompany.contact_email,
        contact_phone: editingCompany.phone,
        website: editingCompany.website,
        status: editingCompany.status,
        subscription_tier: editingCompany.tier,
      }

      let result
      if (editingCompany.id) {
        result = await updateCompany(editingCompany.id, companyData)
      } else {
        result = await createCompany(companyData)
      }

      if (result) {
        setMessage({
          type: 'success',
          text: editingCompany.id ? 'Company updated successfully!' : 'Company created successfully!'
        })
        setIsModalOpen(false)
        setEditingCompany(null)
      } else {
        setMessage({ type: 'error', text: 'Failed to save company. Please try again.' })
      }
    } catch (e) {
      console.error('Error saving company:', e)
      setMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCompany = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this company?')) return

    try {
      const success = await deleteCompany(companyId)
      if (success) {
        setMessage({ type: 'success', text: 'Company deleted successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to delete company. Please try again.' })
      }
    } catch (e) {
      console.error('Error deleting company:', e)
      setMessage({ type: 'error', text: 'An error occurred while deleting.' })
    }
  }

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-600">Enterprise</Badge>
      case 'growth':
        return <Badge variant="default" className="bg-blue-600">Growth</Badge>
      case 'starter':
      default:
        return <Badge variant="outline">Starter</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{message.text}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setMessage(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Companies</h2>
          <p className="text-sm text-muted-foreground">
            Manage client companies and partnerships
          </p>
        </div>
        <Button onClick={handleCreateCompany}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Companies</span>
            </div>
            <p className="text-2xl font-bold">{totals.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold text-success">{totals.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Trial</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">{totals.trial}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{totals.totalLeads}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[130px]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Companies Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No companies found
          </div>
        ) : (
          filteredCompanies.map((company) => (
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditCompany(company)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => handleDeleteCompany(company.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
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
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        company.status === 'Active' ? 'success' :
                        company.status === 'Trial' ? 'warning' : 'secondary'
                      }
                    >
                      {company.status || 'Active'}
                    </Badge>
                    {getTierBadge(company.tier)}
                  </div>
                </div>
                {company.contact_email && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {company.contact_email}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && editingCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
              <h3 className="font-semibold">
                {editingCompany.id ? 'Edit Company' : 'Add New Company'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Name
                </label>
                <Input
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  placeholder="Berkeley Group"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Type</label>
                <select
                  value={editingCompany.type}
                  onChange={(e) => setEditingCompany({ ...editingCompany, type: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="Developer">Developer</option>
                  <option value="Agent">Agent</option>
                  <option value="Broker">Broker</option>
                  <option value="Investor">Investor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contact Name
                </label>
                <Input
                  value={editingCompany.contact_name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, contact_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={editingCompany.contact_email}
                  onChange={(e) => setEditingCompany({ ...editingCompany, contact_email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <Input
                  type="tel"
                  value={editingCompany.phone}
                  onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                  placeholder="+44 20 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </label>
                <Input
                  type="url"
                  value={editingCompany.website}
                  onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={editingCompany.status}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      status: e.target.value as CompanyStatus
                    })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tier</label>
                  <select
                    value={editingCompany.tier}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      tier: e.target.value as EditingCompany['tier']
                    })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border sticky bottom-0 bg-background">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCompany} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : editingCompany.id ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
