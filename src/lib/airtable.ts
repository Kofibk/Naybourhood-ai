// Airtable Integration Service
// Configure your Base ID, Table Names, and Field Mappings below

const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// ============================================
// TABLE CONFIGURATION - Update these to match your Airtable
// ============================================

export const TABLES = {
  leads: 'Leads',           // or 'Buyers', 'Enquiries', etc.
  campaigns: 'Campaigns',   // or 'Ad Campaigns', 'Marketing', etc.
  companies: 'Companies',   // or 'Clients', 'Developers', etc.
  users: 'Users',           // or 'Team', 'Staff', etc.
};

// ============================================
// FIELD MAPPINGS - Map your Airtable field names to app fields
// ============================================

export const FIELD_MAPS = {
  leads: {
    // App Field: 'Airtable Field Name'
    id: 'id',                    // Airtable record ID (auto)
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    budget: 'Budget',
    timeline: 'Timeline',
    source: 'Source',
    campaign: 'Campaign',        // or linked field name
    status: 'Status',
    qualityScore: 'Quality Score',
    intentScore: 'Intent Score',
    createdAt: 'Created',        // or 'Created Time'
    lastContact: 'Last Contact',
    notes: 'Notes',
  },
  campaigns: {
    id: 'id',
    name: 'Name',
    client: 'Client',
    platform: 'Platform',
    status: 'Status',
    spend: 'Spend',
    leads: 'Leads',              // count or number field
    cpl: 'CPL',
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',
    startDate: 'Start Date',
    endDate: 'End Date',
  },
  companies: {
    id: 'id',
    name: 'Name',
    type: 'Type',
    contactName: 'Contact Name',
    contactEmail: 'Contact Email',
    phone: 'Phone',
    campaigns: 'Campaigns',      // count or rollup
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
};

// ============================================
// API FUNCTIONS
// ============================================

async function airtableFetch(endpoint: string, options: RequestInit = {}) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('Airtable not configured. Using demo data.');
    return null;
  }

  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Airtable API error');
  }

  return response.json();
}

// Map Airtable record to app format
function mapRecord<T>(record: any, fieldMap: Record<string, string>): T {
  const mapped: any = { id: record.id };
  
  for (const [appField, airtableField] of Object.entries(fieldMap)) {
    if (appField === 'id') continue;
    mapped[appField] = record.fields[airtableField] ?? null;
  }
  
  return mapped as T;
}

// Fetch all records with pagination
async function fetchAllRecords(tableName: string): Promise<any[]> {
  const records: any[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);
    params.set('pageSize', '100');
    
    const data = await airtableFetch(`${encodeURIComponent(tableName)}?${params}`);
    if (!data) return [];
    
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// ============================================
// DATA FETCHERS
// ============================================

export async function fetchLeads() {
  try {
    const records = await fetchAllRecords(TABLES.leads);
    return records.map(r => mapRecord(r, FIELD_MAPS.leads));
  } catch (error) {
    console.error('Error fetching leads:', error);
    return null;
  }
}

export async function fetchCampaigns() {
  try {
    const records = await fetchAllRecords(TABLES.campaigns);
    return records.map(r => mapRecord(r, FIELD_MAPS.campaigns));
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return null;
  }
}

export async function fetchCompanies() {
  try {
    const records = await fetchAllRecords(TABLES.companies);
    return records.map(r => mapRecord(r, FIELD_MAPS.companies));
  } catch (error) {
    console.error('Error fetching companies:', error);
    return null;
  }
}

export async function fetchUsers() {
  try {
    const records = await fetchAllRecords(TABLES.users);
    return records.map(r => mapRecord(r, FIELD_MAPS.users));
  } catch (error) {
    console.error('Error fetching users:', error);
    return null;
  }
}

// ============================================
// DATA MUTATORS
// ============================================

export async function createLead(data: Partial<any>) {
  const fields: any = {};
  for (const [appField, airtableField] of Object.entries(FIELD_MAPS.leads)) {
    if (appField === 'id') continue;
    if (data[appField] !== undefined) {
      fields[airtableField] = data[appField];
    }
  }

  const result = await airtableFetch(encodeURIComponent(TABLES.leads), {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });

  return result ? mapRecord(result, FIELD_MAPS.leads) : null;
}

export async function updateLead(id: string, data: Partial<any>) {
  const fields: any = {};
  for (const [appField, airtableField] of Object.entries(FIELD_MAPS.leads)) {
    if (appField === 'id') continue;
    if (data[appField] !== undefined) {
      fields[airtableField] = data[appField];
    }
  }

  const result = await airtableFetch(`${encodeURIComponent(TABLES.leads)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });

  return result ? mapRecord(result, FIELD_MAPS.leads) : null;
}

export async function deleteLead(id: string) {
  await airtableFetch(`${encodeURIComponent(TABLES.leads)}/${id}`, {
    method: 'DELETE',
  });
}

export async function updateCampaign(id: string, data: Partial<any>) {
  const fields: any = {};
  for (const [appField, airtableField] of Object.entries(FIELD_MAPS.campaigns)) {
    if (appField === 'id') continue;
    if (data[appField] !== undefined) {
      fields[airtableField] = data[appField];
    }
  }

  const result = await airtableFetch(`${encodeURIComponent(TABLES.campaigns)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });

  return result ? mapRecord(result, FIELD_MAPS.campaigns) : null;
}

// ============================================
// VIEWS & FILTERS
// ============================================

export async function fetchLeadsByStatus(status: string) {
  const params = new URLSearchParams();
  params.set('filterByFormula', `{${FIELD_MAPS.leads.status}} = '${status}'`);
  
  const data = await airtableFetch(`${encodeURIComponent(TABLES.leads)}?${params}`);
  if (!data) return [];
  
  return data.records.map((r: any) => mapRecord(r, FIELD_MAPS.leads));
}

export async function fetchHotLeads(minScore: number = 85) {
  const params = new URLSearchParams();
  params.set('filterByFormula', `OR({${FIELD_MAPS.leads.qualityScore}} >= ${minScore}, {${FIELD_MAPS.leads.intentScore}} >= ${minScore})`);
  params.set('sort[0][field]', FIELD_MAPS.leads.qualityScore);
  params.set('sort[0][direction]', 'desc');
  
  const data = await airtableFetch(`${encodeURIComponent(TABLES.leads)}?${params}`);
  if (!data) return [];
  
  return data.records.map((r: any) => mapRecord(r, FIELD_MAPS.leads));
}

export async function fetchActiveCampaigns() {
  const params = new URLSearchParams();
  params.set('filterByFormula', `{${FIELD_MAPS.campaigns.status}} = 'active'`);
  
  const data = await airtableFetch(`${encodeURIComponent(TABLES.campaigns)}?${params}`);
  if (!data) return [];
  
  return data.records.map((r: any) => mapRecord(r, FIELD_MAPS.campaigns));
}

// ============================================
// AGGREGATIONS (for dashboard metrics)
// ============================================

export async function fetchDashboardMetrics() {
  const [leads, campaigns] = await Promise.all([
    fetchLeads(),
    fetchCampaigns(),
  ]);

  if (!leads || !campaigns) return null;

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l: any) => l.qualityScore >= 85 || l.intentScore >= 85).length;
  const avgScore = leads.length > 0 
    ? Math.round(leads.reduce((acc: number, l: any) => acc + (l.qualityScore || 0), 0) / leads.length)
    : 0;
  
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active');
  const totalSpend = activeCampaigns.reduce((acc: number, c: any) => acc + (c.spend || 0), 0);
  const totalCampaignLeads = activeCampaigns.reduce((acc: number, c: any) => acc + (c.leads || 0), 0);
  const avgCPL = totalCampaignLeads > 0 ? Math.round(totalSpend / totalCampaignLeads) : 0;

  return {
    totalLeads,
    hotLeads,
    avgScore,
    totalSpend,
    avgCPL,
    totalCampaigns: campaigns.length,
    activeCampaigns: activeCampaigns.length,
  };
}

// Check if Airtable is configured
export function isAirtableConfigured(): boolean {
  return !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID);
}
