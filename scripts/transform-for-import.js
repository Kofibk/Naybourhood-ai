/**
 * Transform leads_transformed.json to match Supabase schema exactly
 *
 * Run with: node scripts/transform-for-import.js
 *
 * This creates a new file: leads_ready_for_import.json
 */

const fs = require('fs')
const path = require('path')

// Read the source file
const sourcePath = path.join(__dirname, '..', 'leads_transformed.json')
const outputPath = path.join(__dirname, '..', 'leads_ready_for_import.json')

console.log('Reading source file...')
const leads = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
console.log(`Found ${leads.length} leads`)

// ═══════════════════════════════════════════════════════════════════
// VALUE MAPPINGS - Adjust these based on your Supabase ENUMs
// ═══════════════════════════════════════════════════════════════════

// Valid status values (already defined in the table)
const VALID_STATUSES = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Duplicate',
]

const STATUS_MAP = {
  'disqualified': 'Not Proceeding',
  'dq': 'Not Proceeding',
}

// Map purchase_purpose values
// If your ENUM has specific values, adjust this mapping
const PURPOSE_MAP = {
  'Primary residence': 'Residence',      // or null to skip
  'Dependent studying in the UK': 'Residence',
  'Investment': 'Investment',
}

// Connection status for broker/solicitor
function normalizeConnectionStatus(value) {
  if (value === null || value === undefined || value === '') return 'unknown'
  if (typeof value === 'boolean') return value ? 'yes' : 'unknown'
  const normalized = String(value).toLowerCase().trim()
  if (['yes', 'true', 'already has'].includes(normalized)) return 'yes'
  if (['introduced', 'introduction made'].includes(normalized)) return 'introduced'
  if (['no', 'false', 'none', "doesn't have"].includes(normalized)) return 'no'
  return 'unknown'
}

// Date formatter - UK format to ISO
function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString()

  try {
    // UK format: "6/1/2026 1:20pm"
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

    // ISO format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(dateStr).toISOString()
    }

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
// TRANSFORM EACH LEAD
// ═══════════════════════════════════════════════════════════════════

console.log('Transforming leads...')

const transformedLeads = leads.map((lead, index) => {
  // Normalize status
  let status = lead.status || 'Contact Pending'
  const statusLower = status.toLowerCase()
  if (STATUS_MAP[statusLower]) {
    status = STATUS_MAP[statusLower]
  }
  if (!VALID_STATUSES.includes(status)) {
    console.warn(`Lead ${index}: Unknown status "${lead.status}" → defaulting to "Contact Pending"`)
    status = 'Contact Pending'
  }

  // Normalize purpose - SET TO NULL if not a valid ENUM value
  // This avoids the ENUM error by simply not setting the field
  let purchase_purpose = null
  if (lead.purpose) {
    if (PURPOSE_MAP[lead.purpose]) {
      purchase_purpose = PURPOSE_MAP[lead.purpose]
    } else if (['Investment', 'Residence', 'Both'].includes(lead.purpose)) {
      purchase_purpose = lead.purpose
    } else {
      console.warn(`Lead ${index}: Unknown purpose "${lead.purpose}" → setting to null`)
    }
  }

  return {
    // Names
    full_name: lead.full_name || lead.name || 'Unknown',
    first_name: lead.first_name || null,
    last_name: lead.last_name || null,

    // Contact
    email: lead.email || null,
    phone: lead.phone || null,
    country: lead.country || null,

    // Budget
    budget_range: lead.budget_range || lead.budget || null,
    budget_min: lead.budget_min ? Number(lead.budget_min) : null,
    budget_max: lead.budget_max ? Number(lead.budget_max) : null,

    // Property preferences
    preferred_bedrooms: lead.preferred_bedrooms || lead.bedrooms || null,
    preferred_location: lead.preferred_location || lead.location || lead.area || null,

    // Timeline & Purpose
    timeline_to_purchase: lead.timeline_to_purchase || lead.timeline || null,
    purchase_purpose: purchase_purpose,
    ready_within_28_days: Boolean(lead.ready_within_28_days || lead.ready_in_28_days),

    // Source & Campaign
    source_platform: lead.source_platform || lead.source || null,
    source_campaign: lead.source_campaign || lead.campaign || null,
    development_name: lead.development_name || lead.development || null,
    enquiry_type: lead.enquiry_type || null,

    // Status
    status: status,

    // Financial
    payment_method: lead.payment_method || null,
    proof_of_funds: Boolean(lead.proof_of_funds),
    mortgage_status: lead.mortgage_status || null,
    uk_broker: normalizeConnectionStatus(lead.uk_broker),
    uk_solicitor: normalizeConnectionStatus(lead.uk_solicitor),

    // Notes
    notes: lead.notes || null,
    agent_transcript: lead.agent_transcript || lead.transcript || null,

    // Viewing
    viewing_intent_confirmed: Boolean(lead.viewing_intent_confirmed),
    viewing_booked: Boolean(lead.viewing_booked),
    viewing_date: lead.viewing_date || null,

    // Communication
    replied: Boolean(lead.replied),
    stop_agent_communication: Boolean(lead.stop_agent_communication || lead.stop_comms),
    connect_to_broker: Boolean(lead.connect_to_broker || lead.broker_connected),

    // Timestamps
    date_added: parseDate(lead.date_added),
  }
})

// ═══════════════════════════════════════════════════════════════════
// WRITE OUTPUT
// ═══════════════════════════════════════════════════════════════════

console.log('Writing output file...')
fs.writeFileSync(outputPath, JSON.stringify(transformedLeads, null, 2))

console.log(`\n✅ Done! Created: leads_ready_for_import.json`)
console.log(`   Total leads: ${transformedLeads.length}`)

// Summary
const purposeNull = transformedLeads.filter(l => l.purchase_purpose === null).length
const statusFixed = leads.filter((l, i) => l.status !== transformedLeads[i].status).length

console.log(`\nSummary:`)
console.log(`   - Leads with null purchase_purpose: ${purposeNull}`)
console.log(`   - Status values fixed: ${statusFixed}`)
