import { CheckCircle, XCircle } from 'lucide-react'

// Status options for lead management
export const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Disqualified',
]

// Classification colors and labels
export const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string; description: string }> = {
  'Hot': { bg: 'bg-red-500', text: 'text-white', label: 'Hot', description: 'Quality ≥70 AND Intent ≥70. Ready to buy. Respond within 1 hour.' },
  'Warm-Qualified': { bg: 'bg-orange-500', text: 'text-white', label: 'Warm (Qualified)', description: 'Quality ≥70, Intent ≥45. Financially ready but needs nurturing.' },
  'Warm-Engaged': { bg: 'bg-amber-500', text: 'text-white', label: 'Warm (Engaged)', description: 'Quality ≥45, Intent ≥70. Highly interested but needs qualification.' },
  'Nurture': { bg: 'bg-blue-400', text: 'text-white', label: 'Nurture', description: 'Quality 35-69, Intent 35-69. Requires longer-term engagement.' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold', description: 'Lower scores. May need re-engagement or qualification.' },
  'Disqualified': { bg: 'bg-gray-600', text: 'text-white', label: 'Disqualified', description: 'Quality <20 OR Intent <20. Not suitable for current inventory.' },
  'Spam': { bg: 'bg-red-700', text: 'text-white', label: 'Spam', description: 'Detected as spam or fake lead.' },
}

export const PRIORITY_CONFIG: Record<string, { bg: string; label: string; time: string; description: string }> = {
  'P1': { bg: 'bg-red-100 text-red-800 border-red-300', label: 'P1 - Urgent', time: '< 1 hour', description: 'Hot leads - respond immediately' },
  'P2': { bg: 'bg-orange-100 text-orange-800 border-orange-300', label: 'P2 - High', time: '< 4 hours', description: 'Warm leads - respond same day' },
  'P3': { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'P3 - Medium', time: '< 24 hours', description: 'Nurture leads - respond within a day' },
  'P4': { bg: 'bg-gray-100 text-gray-800 border-gray-300', label: 'P4 - Low', time: '48+ hours', description: 'Cold/Disqualified - low priority' },
}

// Connection Status Options for Broker/Solicitor
export const CONNECTION_STATUS_OPTIONS = [
  { value: 'yes', label: 'Yes, already has', icon: CheckCircle, color: 'text-green-600' },
  { value: 'introduced', label: 'Introduction made', icon: CheckCircle, color: 'text-green-600' },
  { value: 'no', label: "No, doesn't have", icon: XCircle, color: 'text-red-400' },
  { value: 'unknown', label: 'Unknown', icon: null, color: 'text-muted-foreground' },
] as const

// Parse budget range string to extract min/max values
// Handles formats like: "£1 - £2 Million", "£1M - £2M", "£500K - £1M", "£12000K"
export function parseBudgetRange(budgetString: string | null | undefined): { min: number | null; max: number | null } {
  if (!budgetString) return { min: null, max: null }

  const str = budgetString.toString().toLowerCase()

  // Helper to convert value with suffix to number
  const parseValue = (val: string): number | null => {
    if (!val) return null
    // Remove £ and whitespace
    val = val.replace(/[£,\s]/g, '')

    // Handle different formats
    if (val.includes('million') || val.endsWith('m')) {
      const num = parseFloat(val.replace(/million|m/gi, ''))
      return isNaN(num) ? null : num * 1000000
    }
    if (val.endsWith('k')) {
      const num = parseFloat(val.replace(/k/gi, ''))
      return isNaN(num) ? null : num * 1000
    }
    // Plain number
    const num = parseFloat(val)
    return isNaN(num) ? null : num
  }

  // Try to find range pattern (e.g., "1 - 2 million", "1m - 2m")
  const rangeMatch = str.match(/([£\d.,]+[km]?)\s*[-–to]+\s*([£\d.,]+)\s*(million|m|k)?/i)
  if (rangeMatch) {
    const suffix = rangeMatch[3] || ''
    const minStr = rangeMatch[1] + (rangeMatch[1].match(/[km]$/i) ? '' : suffix)
    const maxStr = rangeMatch[2] + suffix
    return {
      min: parseValue(minStr),
      max: parseValue(maxStr)
    }
  }

  // Single value (e.g., "£2M", "£500K")
  const singleValue = parseValue(str)
  if (singleValue) {
    return { min: singleValue, max: singleValue }
  }

  return { min: null, max: null }
}

// Format budget value for display (e.g., 12000000 -> "£12M", 500000 -> "£500K")
export function formatBudgetValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'

  if (value >= 1000000) {
    const millions = value / 1000000
    return `£${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
  }
  if (value >= 1000) {
    const thousands = value / 1000
    return `£${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`
  }
  return `£${value.toLocaleString()}`
}

// Format date for display (e.g., "15 Jan 2025")
export function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format date with time for display (e.g., "15 Jan 2025, 14:30")
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
