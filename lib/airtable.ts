// Airtable Integration Service
// Configure your Base ID, Table Names, and Field Mappings below

const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`

// Debug: Log configuration on load
console.log('[Airtable Config] API Key set:', !!AIRTABLE_API_KEY, AIRTABLE_API_KEY ? `(${AIRTABLE_API_KEY.substring(0, 10)}...)` : '')
console.log('[Airtable Config] Base ID:', AIRTABLE_BASE_ID)
console.log('[Airtable Config] Base URL:', BASE_URL)

// Table Configuration - Updated for Naybourhood
export const TABLES = {
  leads: 'buyers',
  campaigns: 'campaigns previous data',
  companies: 'Companies',
  users: 'Users',
  developments: 'Developments',
}

// Field Mappings - Map Airtable field names to app fields
// These mappings try multiple common field name variations
export const FIELD_MAPS = {
  leads: {
    id: 'id',
    name: 'Name',
    full_name: 'Full Name',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    budget: 'Budget',
    budget_min: 'Budget Min',
    budget_max: 'Budget Max',
    bedrooms: 'Bedrooms',
    location: 'Location',
    area: 'Area',
    timeline: 'Timeline',
    source: 'Source',
    campaign: 'Campaign',
    campaign_id: 'Campaign ID',
    status: 'Status',
    qualityScore: 'Quality Score',
    intentScore: 'Intent Score',
    payment_method: 'Payment Method',
    proof_of_funds: 'Proof of Funds',
    mortgage_status: 'Mortgage Status',
    uk_broker: 'UK Broker',
    uk_solicitor: 'UK Solicitor',
    createdAt: 'Created',
    lastContact: 'Last Contact',
    notes: 'Notes',
    assigned_to: 'Assigned To',
    assigned_user: 'Assigned User',
    company_id: 'Company ID',
  },
  campaigns: {
    id: 'id',
    name: 'Name',
    client: 'Client',
    development: 'Development',
    development_name: 'Development Name',
    platform: 'Platform',
    status: 'Status',
    spend: 'Spend',
    amount_spent: 'Amount Spent',
    total_spend: 'Total Spend',
    leads: 'Leads',
    lead_count: 'Lead Count',
    cpl: 'CPL',
    cost_per_lead: 'Cost Per Lead',
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',
    startDate: 'Start Date',
    endDate: 'End Date',
  },
  developments: {
    id: 'id',
    name: 'Name',
    location: 'Location',
    address: 'Address',
    developer: 'Developer',
    status: 'Status',
    units: 'Units',
    total_units: 'Total Units',
    available_units: 'Available Units',
    price_from: 'Price From',
    price_to: 'Price To',
    completion_date: 'Completion Date',
    description: 'Description',
    image_url: 'Image URL',
    features: 'Features',
    total_leads: 'Total Leads',
    total_spend: 'Total Spend',
  },
  companies: {
    id: 'id',
    name: 'Name',
    type: 'Type',
    contactName: 'Contact Name',
    contactEmail: 'Contact Email',
    phone: 'Phone',
    campaigns: 'Campaigns',
    totalSpend: 'Total Spend',
    totalLeads: 'Total Leads',
    status: 'Status',
    joinedDate: 'Joined Date',
  },
  users: {
    id: 'id',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    company: 'Company',
    lastActive: 'Last Active',
    status: 'Status',
  },
}

// API Functions
async function airtableFetch(endpoint: string, options: RequestInit = {}) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('[Airtable] Not configured - missing API_KEY or BASE_ID')
    return null
  }

  const fullUrl = `${BASE_URL}/${endpoint}`
  console.log('[Airtable] Fetching:', fullUrl.substring(0, 100) + '...')

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    console.log('[Airtable] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Airtable] API Error:', response.status, errorText)
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.error?.message || `Airtable API error: ${response.status}`)
      } catch {
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`)
      }
    }

    return response.json()
  } catch (error) {
    console.error('[Airtable] Fetch error:', error)
    throw error
  }
}

// Map Airtable record to app format - also returns raw fields for debugging
function mapRecord<T>(record: any, fieldMap: Record<string, string>, logRaw = false): T {
  const mapped: any = { id: record.id }

  // Log raw fields for debugging (only first record)
  if (logRaw) {
    console.log('[Airtable] Raw record fields:', Object.keys(record.fields || {}))
    console.log('[Airtable] Raw record values:', record.fields)
  }

  for (const [appField, airtableField] of Object.entries(fieldMap)) {
    if (appField === 'id') continue
    mapped[appField] = record.fields[airtableField] ?? null
  }

  // Also copy raw fields directly for flexible access
  if (record.fields) {
    for (const [key, value] of Object.entries(record.fields)) {
      // Add raw field access using original Airtable field names
      const lowerKey = key.toLowerCase().replace(/\s+/g, '_')
      if (!(lowerKey in mapped)) {
        mapped[lowerKey] = value
      }
      // Also add with original casing
      if (!(key in mapped)) {
        mapped[key] = value
      }
    }
  }

  return mapped as T
}

// Fetch all records with pagination
async function fetchAllRecords(tableName: string): Promise<any[]> {
  const records: any[] = []
  let offset: string | undefined

  console.log(`[Airtable] ========== FETCH START ==========`)
  console.log(`[Airtable] Table name: "${tableName}"`)
  console.log(`[Airtable] Full base URL: ${BASE_URL}`)

  do {
    const params = new URLSearchParams()
    if (offset) params.set('offset', offset)
    params.set('pageSize', '100')

    const url = `${encodeURIComponent(tableName)}?${params}`
    const fullUrl = `${BASE_URL}/${url}`
    console.log(`[Airtable] Full request URL: ${fullUrl}`)

    const data = await airtableFetch(url)

    console.log(`[Airtable] Raw response data:`, JSON.stringify(data, null, 2).substring(0, 500))

    if (!data) {
      console.log(`[Airtable] No data returned for table: "${tableName}" - data is null/undefined`)
      return []
    }

    if (!data.records) {
      console.log(`[Airtable] Response has no records property. Response keys:`, Object.keys(data))
      return []
    }

    console.log(`[Airtable] Response for "${tableName}":`, {
      recordCount: data.records?.length || 0,
      hasOffset: !!data.offset,
      firstRecordId: data.records?.[0]?.id || 'none',
      firstRecordFields: data.records?.[0] ? Object.keys(data.records[0].fields || {}) : 'none'
    })

    if (data.records?.[0]) {
      console.log(`[Airtable] First record full data:`, JSON.stringify(data.records[0], null, 2))
    }

    records.push(...data.records)
    offset = data.offset
  } while (offset)

  console.log(`[Airtable] ========== FETCH COMPLETE: ${records.length} records ==========`)
  return records
}

// Data Fetchers
export async function fetchLeads() {
  try {
    const records = await fetchAllRecords(TABLES.leads)
    console.log(`[Airtable] Fetched ${records.length} leads`)
    // Log first record for debugging
    return records.map((r, i) => mapRecord(r, FIELD_MAPS.leads, i === 0))
  } catch (error) {
    console.error('Error fetching leads:', error)
    return null
  }
}

export async function fetchCampaigns() {
  try {
    const records = await fetchAllRecords(TABLES.campaigns)
    console.log(`[Airtable] Fetched ${records.length} campaigns`)
    // Log first record for debugging
    return records.map((r, i) => mapRecord(r, FIELD_MAPS.campaigns, i === 0))
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return null
  }
}

export async function fetchDevelopments() {
  try {
    const records = await fetchAllRecords(TABLES.developments)
    console.log(`[Airtable] Fetched ${records.length} developments`)
    // Log first record for debugging
    return records.map((r, i) => mapRecord(r, FIELD_MAPS.developments, i === 0))
  } catch (error) {
    console.error('Error fetching developments:', error)
    return null
  }
}

export async function fetchCompanies() {
  try {
    const records = await fetchAllRecords(TABLES.companies)
    return records.map((r) => mapRecord(r, FIELD_MAPS.companies))
  } catch (error) {
    console.error('Error fetching companies:', error)
    return null
  }
}

export async function fetchUsers() {
  try {
    const records = await fetchAllRecords(TABLES.users)
    return records.map((r) => mapRecord(r, FIELD_MAPS.users))
  } catch (error) {
    console.error('Error fetching users:', error)
    return null
  }
}

// Data Mutators
export async function createLead(data: Partial<any>) {
  const fields: any = {}
  for (const [appField, airtableField] of Object.entries(FIELD_MAPS.leads)) {
    if (appField === 'id') continue
    if (data[appField] !== undefined) {
      fields[airtableField] = data[appField]
    }
  }

  const result = await airtableFetch(encodeURIComponent(TABLES.leads), {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })

  return result ? mapRecord(result, FIELD_MAPS.leads) : null
}

export async function updateLead(id: string, data: Partial<any>) {
  const fields: any = {}
  for (const [appField, airtableField] of Object.entries(FIELD_MAPS.leads)) {
    if (appField === 'id') continue
    if (data[appField] !== undefined) {
      fields[airtableField] = data[appField]
    }
  }

  const result = await airtableFetch(`${encodeURIComponent(TABLES.leads)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })

  return result ? mapRecord(result, FIELD_MAPS.leads) : null
}

export async function deleteLead(id: string) {
  await airtableFetch(`${encodeURIComponent(TABLES.leads)}/${id}`, {
    method: 'DELETE',
  })
}

export async function updateCampaign(id: string, data: Partial<any>) {
  const fields: any = {}
  for (const [appField, airtableField] of Object.entries(FIELD_MAPS.campaigns)) {
    if (appField === 'id') continue
    if (data[appField] !== undefined) {
      fields[airtableField] = data[appField]
    }
  }

  const result = await airtableFetch(`${encodeURIComponent(TABLES.campaigns)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })

  return result ? mapRecord(result, FIELD_MAPS.campaigns) : null
}

// Views & Filters
export async function fetchLeadsByStatus(status: string) {
  const params = new URLSearchParams()
  params.set('filterByFormula', `{${FIELD_MAPS.leads.status}} = '${status}'`)

  const data = await airtableFetch(`${encodeURIComponent(TABLES.leads)}?${params}`)
  if (!data) return []

  return data.records.map((r: any) => mapRecord(r, FIELD_MAPS.leads))
}

export async function fetchHotLeads(minScore: number = 85) {
  const params = new URLSearchParams()
  params.set(
    'filterByFormula',
    `OR({${FIELD_MAPS.leads.qualityScore}} >= ${minScore}, {${FIELD_MAPS.leads.intentScore}} >= ${minScore})`
  )
  params.set('sort[0][field]', FIELD_MAPS.leads.qualityScore)
  params.set('sort[0][direction]', 'desc')

  const data = await airtableFetch(`${encodeURIComponent(TABLES.leads)}?${params}`)
  if (!data) return []

  return data.records.map((r: any) => mapRecord(r, FIELD_MAPS.leads))
}

export async function fetchActiveCampaigns() {
  const params = new URLSearchParams()
  params.set('filterByFormula', `{${FIELD_MAPS.campaigns.status}} = 'active'`)

  const data = await airtableFetch(`${encodeURIComponent(TABLES.campaigns)}?${params}`)
  if (!data) return []

  return data.records.map((r: any) => mapRecord(r, FIELD_MAPS.campaigns))
}

// Check if Airtable is configured
export function isAirtableConfigured(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID)
}
