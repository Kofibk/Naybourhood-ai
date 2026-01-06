/**
 * Lead Data Normalizer
 *
 * Ensures consistent data format when importing leads from any source
 * (Airtable, CSV, API, etc.) into Supabase.
 *
 * This handles:
 * - Status normalization (maps various status names to standard pipeline statuses)
 * - Column name mapping (Airtable field names → Supabase column names)
 * - Date parsing (various formats → ISO 8601)
 * - Data validation and cleanup
 */

// ═══════════════════════════════════════════════════════════════════
// STANDARD STATUS VALUES - These are the only valid statuses
// ═══════════════════════════════════════════════════════════════════

export const VALID_STATUSES = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Duplicate',
] as const

export type ValidStatus = typeof VALID_STATUSES[number]

// ═══════════════════════════════════════════════════════════════════
// STATUS MAPPING - Maps various input statuses to standard statuses
// ═══════════════════════════════════════════════════════════════════

const STATUS_MAP: Record<string, ValidStatus> = {
  // Standard statuses (case variations)
  'contact pending': 'Contact Pending',
  'contactpending': 'Contact Pending',
  'follow up': 'Follow Up',
  'followup': 'Follow Up',
  'follow-up': 'Follow Up',
  'viewing booked': 'Viewing Booked',
  'viewingbooked': 'Viewing Booked',
  'negotiating': 'Negotiating',
  'reserved': 'Reserved',
  'exchanged': 'Exchanged',
  'completed': 'Completed',
  'not proceeding': 'Not Proceeding',
  'notproceeding': 'Not Proceeding',
  'not-proceeding': 'Not Proceeding',
  'duplicate': 'Duplicate',

  // Legacy/Airtable status mappings
  'new': 'Contact Pending',
  'new lead': 'Contact Pending',
  'newlead': 'Contact Pending',
  'contacted': 'Follow Up',
  'qualified': 'Follow Up',
  'interested': 'Follow Up',
  'hot': 'Follow Up',
  'warm': 'Contact Pending',
  'cold': 'Contact Pending',
  'viewing scheduled': 'Viewing Booked',
  'viewing confirmed': 'Viewing Booked',
  'offer made': 'Negotiating',
  'offer accepted': 'Reserved',
  'under offer': 'Reserved',
  'sold': 'Completed',
  'exchange': 'Exchanged',
  'exchanging': 'Exchanged',
  'lost': 'Not Proceeding',
  'dead': 'Not Proceeding',
  'unqualified': 'Not Proceeding',
  'no answer': 'Contact Pending',
  'callback': 'Follow Up',
  'documentation': 'Negotiating',
}

/**
 * Normalize a status value to a valid pipeline status
 */
export function normalizeStatus(status: string | null | undefined): ValidStatus {
  if (!status) return 'Contact Pending'

  const normalized = status.toLowerCase().trim()

  // Direct match
  if (STATUS_MAP[normalized]) {
    return STATUS_MAP[normalized]
  }

  // Check if it's already a valid status (case-insensitive)
  const validMatch = VALID_STATUSES.find(
    s => s.toLowerCase() === normalized
  )
  if (validMatch) return validMatch

  // Default fallback
  console.warn(`Unknown status "${status}" - defaulting to "Contact Pending"`)
  return 'Contact Pending'
}

// ═══════════════════════════════════════════════════════════════════
// COLUMN NAME MAPPING - Airtable/source fields → Supabase columns
// ═══════════════════════════════════════════════════════════════════

interface SourceLead {
  // Names - various field names from different sources
  full_name?: string
  fullName?: string
  name?: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string

  // Contact
  email?: string
  phone?: string
  phone_number?: string
  phoneNumber?: string
  country?: string

  // Budget - various formats
  budget?: string
  budget_range?: string
  budgetRange?: string
  budget_min?: number | string
  budgetMin?: number | string
  budget_max?: number | string
  budgetMax?: number | string

  // Property preferences
  bedrooms?: number | string
  preferred_bedrooms?: number | string
  preferredBedrooms?: number | string
  location?: string
  area?: string
  preferred_location?: string
  preferredLocation?: string

  // Timeline & Purpose
  timeline?: string
  timeline_to_purchase?: string
  timelineToPurchase?: string
  purpose?: string
  purchase_purpose?: string
  purchasePurpose?: string
  ready_in_28_days?: boolean
  ready_within_28_days?: boolean
  readyIn28Days?: boolean

  // Source & Campaign
  source?: string
  source_platform?: string
  sourcePlatform?: string
  campaign?: string
  source_campaign?: string
  sourceCampaign?: string
  development?: string
  development_name?: string
  developmentName?: string
  enquiry_type?: string
  enquiryType?: string

  // Status
  status?: string

  // Financial
  payment_method?: string
  paymentMethod?: string
  proof_of_funds?: boolean
  proofOfFunds?: boolean
  mortgage_status?: string
  mortgageStatus?: string
  uk_broker?: boolean
  ukBroker?: boolean
  uk_solicitor?: boolean
  ukSolicitor?: boolean

  // Notes
  notes?: string
  transcript?: string
  agent_transcript?: string

  // Viewing
  viewing_intent_confirmed?: boolean
  viewingIntentConfirmed?: boolean
  viewing_booked?: boolean
  viewingBooked?: boolean
  viewing_date?: string
  viewingDate?: string

  // Communication
  replied?: boolean
  stop_comms?: boolean
  stopComms?: boolean
  stop_agent_communication?: boolean
  broker_connected?: boolean
  brokerConnected?: boolean
  connect_to_broker?: boolean

  // Dates
  date_added?: string
  dateAdded?: string
  created_at?: string
  createdAt?: string

  // Any other fields
  [key: string]: any
}

export interface NormalizedLead {
  // Required
  full_name: string

  // Name parts
  first_name: string | null
  last_name: string | null

  // Contact
  email: string | null
  phone: string | null
  country: string | null

  // Budget
  budget_range: string | null
  budget_min: number | null
  budget_max: number | null

  // Property preferences
  preferred_bedrooms: number | null
  preferred_location: string | null

  // Timeline & Purpose
  timeline_to_purchase: string | null
  purchase_purpose: string | null
  ready_within_28_days: boolean

  // Source & Campaign
  source_platform: string | null
  source_campaign: string | null
  development_name: string | null
  enquiry_type: string | null

  // Status - always valid
  status: ValidStatus

  // Financial
  payment_method: string | null
  proof_of_funds: boolean
  mortgage_status: string | null
  uk_broker: boolean
  uk_solicitor: boolean

  // Notes
  notes: string | null
  agent_transcript: string | null

  // Viewing
  viewing_intent_confirmed: boolean
  viewing_booked: boolean
  viewing_date: string | null

  // Communication
  replied: boolean
  stop_agent_communication: boolean
  connect_to_broker: boolean

  // Timestamps
  date_added: string
}

// ═══════════════════════════════════════════════════════════════════
// DATE PARSING
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse various date formats to ISO 8601
 * Handles: "6/1/2026 1:20pm", "2026-01-06", "Jan 6, 2026", etc.
 */
export function parseDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString()

  try {
    // UK format: "6/1/2026 1:20pm" (day/month/year)
    const ukMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})(am|pm)?/i)
    if (ukMatch) {
      const [, day, month, year, hours, minutes, ampm] = ukMatch
      let hour = parseInt(hours)
      if (ampm?.toLowerCase() === 'pm' && hour < 12) hour += 12
      if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(minutes)).toISOString()
    }

    // UK date only: "6/1/2026"
    const ukDateOnly = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (ukDateOnly) {
      const [, day, month, year] = ukDateOnly
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString()
    }

    // ISO format already
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr).toISOString()
    }

    // Try standard Date parsing
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }

    return new Date().toISOString()
  } catch {
    return new Date().toISOString()
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUDGET PARSING
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse budget strings like "£400K - £500K" to min/max numbers
 */
export function parseBudgetRange(budgetStr: string | null | undefined): { min: number | null, max: number | null } {
  if (!budgetStr) return { min: null, max: null }

  const parseAmount = (str: string): number | null => {
    const cleaned = str.replace(/[£$,\s]/g, '')

    // Handle "K" suffix
    if (cleaned.match(/(\d+\.?\d*)K/i)) {
      const match = cleaned.match(/(\d+\.?\d*)K/i)
      return match ? parseFloat(match[1]) * 1000 : null
    }

    // Handle "M" or "Million" suffix
    if (cleaned.match(/(\d+\.?\d*)\s*(M|Million)/i)) {
      const match = cleaned.match(/(\d+\.?\d*)/i)
      return match ? parseFloat(match[1]) * 1000000 : null
    }

    // Plain number
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  const parts = budgetStr.split('-').map(s => s.trim())

  return {
    min: parts[0] ? parseAmount(parts[0]) : null,
    max: parts[1] ? parseAmount(parts[1]) : parseAmount(parts[0])
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN NORMALIZER FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Normalize a lead from any source to Supabase format
 */
export function normalizeLead(source: SourceLead): NormalizedLead {
  // Build full name from parts if not provided
  const firstName = source.first_name || source.firstName || null
  const lastName = source.last_name || source.lastName || null
  const fullName = source.full_name || source.fullName || source.name ||
    (firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : 'Unknown')

  // Parse budget
  const budgetStr = source.budget_range || source.budgetRange || source.budget
  const { min: budgetMin, max: budgetMax } = parseBudgetRange(budgetStr)

  // Parse bedrooms
  const bedroomsRaw = source.preferred_bedrooms || source.preferredBedrooms || source.bedrooms
  const bedrooms = typeof bedroomsRaw === 'string' ? parseInt(bedroomsRaw) : bedroomsRaw

  // Parse date
  const dateAdded = parseDate(
    source.date_added || source.dateAdded || source.created_at || source.createdAt
  )

  return {
    // Names
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,

    // Contact
    email: source.email || null,
    phone: source.phone || source.phone_number || source.phoneNumber || null,
    country: source.country || null,

    // Budget
    budget_range: budgetStr || null,
    budget_min: source.budget_min != null ? Number(source.budget_min) : budgetMin,
    budget_max: source.budget_max != null ? Number(source.budget_max) : budgetMax,

    // Property preferences
    preferred_bedrooms: bedrooms && !isNaN(bedrooms) ? bedrooms : null,
    preferred_location: source.preferred_location || source.preferredLocation || source.location || source.area || null,

    // Timeline & Purpose
    timeline_to_purchase: source.timeline_to_purchase || source.timelineToPurchase || source.timeline || null,
    purchase_purpose: source.purchase_purpose || source.purchasePurpose || source.purpose || null,
    ready_within_28_days: Boolean(source.ready_within_28_days || source.ready_in_28_days || source.readyIn28Days),

    // Source & Campaign
    source_platform: source.source_platform || source.sourcePlatform || source.source || null,
    source_campaign: source.source_campaign || source.sourceCampaign || source.campaign || null,
    development_name: source.development_name || source.developmentName || source.development || null,
    enquiry_type: source.enquiry_type || source.enquiryType || null,

    // Status - ALWAYS normalized to valid status
    status: normalizeStatus(source.status),

    // Financial
    payment_method: source.payment_method || source.paymentMethod || null,
    proof_of_funds: Boolean(source.proof_of_funds || source.proofOfFunds),
    mortgage_status: source.mortgage_status || source.mortgageStatus || null,
    uk_broker: Boolean(source.uk_broker || source.ukBroker),
    uk_solicitor: Boolean(source.uk_solicitor || source.ukSolicitor),

    // Notes
    notes: source.notes || null,
    agent_transcript: source.agent_transcript || source.transcript || null,

    // Viewing
    viewing_intent_confirmed: Boolean(source.viewing_intent_confirmed || source.viewingIntentConfirmed),
    viewing_booked: Boolean(source.viewing_booked || source.viewingBooked),
    viewing_date: source.viewing_date || source.viewingDate || null,

    // Communication
    replied: Boolean(source.replied),
    stop_agent_communication: Boolean(source.stop_agent_communication || source.stop_comms || source.stopComms),
    connect_to_broker: Boolean(source.connect_to_broker || source.broker_connected || source.brokerConnected),

    // Timestamps
    date_added: dateAdded,
  }
}

/**
 * Normalize an array of leads
 */
export function normalizeLeads(leads: SourceLead[]): NormalizedLead[] {
  return leads.map(normalizeLead)
}
