import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function getDateString(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GB').format(num)
}

// Format price as £xxxK or £x.xM for compact display
export function formatPriceShort(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '?'

  // If it's already formatted with £ and K/M, return as-is
  if (typeof value === 'string') {
    const upperVal = value.toUpperCase()
    if (upperVal.includes('K') || upperVal.includes('M')) {
      // Already formatted, just clean it up
      return value.startsWith('£') ? value : `£${value}`
    }
  }

  // Parse numeric value from string or number
  let numValue: number
  if (typeof value === 'string') {
    // Remove £, commas, spaces
    const cleaned = value.replace(/[£,\s]/g, '')
    numValue = parseFloat(cleaned)
  } else {
    numValue = value
  }

  if (isNaN(numValue) || numValue === 0) return '?'

  // Format as K or M
  if (numValue >= 1000000) {
    const millions = numValue / 1000000
    // Show one decimal if not a whole number
    return millions % 1 === 0
      ? `£${millions}M`
      : `£${millions.toFixed(1)}M`
  } else if (numValue >= 1000) {
    const thousands = Math.round(numValue / 1000)
    return `£${thousands}K`
  } else {
    return `£${Math.round(numValue)}`
  }
}

// Format a price range as "£xxxK - £xxxK" or "£x.xM - £x.xM"
export function formatPriceRange(from: string | number | null | undefined, to: string | number | null | undefined): string {
  const formattedFrom = formatPriceShort(from)
  const formattedTo = formatPriceShort(to)

  if (formattedFrom === '?' && formattedTo === '?') return ''
  if (formattedFrom === '?') return `Up to ${formattedTo}`
  if (formattedTo === '?') return `From ${formattedFrom}`

  return `${formattedFrom} - ${formattedTo}`
}
