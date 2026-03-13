import Anthropic from '@anthropic-ai/sdk'

export interface EnrichmentResult {
  identityConfirmed: 'yes' | 'partial' | 'no'
  professionalBackground: string
  businessActivity: string
  wealthSignals: string
  propertyHistory: string
  mediaPresence: string
  riskFlags: string
  enrichmentConfidence: 'high' | 'medium' | 'low'
  rawSummary: string
}

const EMPTY_RESULT: EnrichmentResult = {
  identityConfirmed: 'no',
  professionalBackground: 'No data found.',
  businessActivity: 'No data found.',
  wealthSignals: 'No data found.',
  propertyHistory: 'No data found.',
  mediaPresence: 'No data found.',
  riskFlags: 'None identified.',
  enrichmentConfidence: 'low',
  rawSummary: 'No enrichment data was available for this buyer.',
}

function buildEnrichmentPrompt(buyer: {
  name?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  location?: string
}): string {
  return `Before writing anything, search the web for publicly available information about this buyer using their full name, email domain, phone number prefix, company name, and any other identifiers provided below. Search for:

- LinkedIn profile or professional biography
- Company affiliations, director records, or business registrations
- News mentions, interviews, or press coverage
- Social media presence or public profiles
- Property ownership records or planning applications
- Wealth signals — business activity, investments, assets, funding rounds
- Any red flags — sanctions lists, adverse media, PEP status, fraud mentions

Cross-reference what you find against the structured data provided. Prioritise credible, verifiable sources. Discard anything speculative or unsubstantiated. If a result is ambiguous or could refer to a different person, do not include it. If nothing meaningful is found, note that no enrichment data was available.

Return a clean summary of what you found under these headings:

- Identity Confirmed: [yes / partial / no]
- Professional Background: [what they do, company, seniority]
- Business Activity: [any companies, directorships, registered entities]
- Wealth Signals: [any indicators of financial capacity]
- Property History: [any known property activity]
- Media Presence: [notable mentions, interviews, public profile]
- Risk Flags: [adverse media, PEP status, sanctions, anything requiring enhanced due diligence]
- Enrichment Confidence: [high / medium / low — based on source quality and match certainty]

Buyer identifiers:
Name: ${buyer.name || 'Not provided'}
Email: ${buyer.email || 'Not provided'}
Phone: ${buyer.phone || 'Not provided'}
Company: ${buyer.company || 'Not provided'}
Job Title: ${buyer.jobTitle || 'Not provided'}
Location: ${buyer.location || 'Not provided'}`
}

function parseEnrichmentResponse(text: string): EnrichmentResult {
  const get = (label: string): string => {
    const regex = new RegExp(`${label}:\\s*(.+?)(?:\\n-|\\n\\n|$)`, 'is')
    const match = text.match(regex)
    return match?.[1]?.trim() || 'No data found.'
  }

  const identityRaw = get('Identity Confirmed').toLowerCase()
  const identityConfirmed: EnrichmentResult['identityConfirmed'] =
    identityRaw.includes('yes') ? 'yes' :
    identityRaw.includes('partial') ? 'partial' : 'no'

  const confidenceRaw = get('Enrichment Confidence').toLowerCase()
  const enrichmentConfidence: EnrichmentResult['enrichmentConfidence'] =
    confidenceRaw.includes('high') ? 'high' :
    confidenceRaw.includes('medium') ? 'medium' : 'low'

  return {
    identityConfirmed,
    professionalBackground: get('Professional Background'),
    businessActivity: get('Business Activity'),
    wealthSignals: get('Wealth Signals'),
    propertyHistory: get('Property History'),
    mediaPresence: get('Media Presence'),
    riskFlags: get('Risk Flags'),
    enrichmentConfidence,
    rawSummary: text,
  }
}

/**
 * Enriches a buyer profile using web search via the Anthropic API.
 * Uses Claude's web_search server tool to find publicly available information.
 * Returns structured enrichment data or a fallback empty result on failure.
 */
export async function enrichBuyerProfile(
  client: Anthropic,
  buyer: {
    name?: string
    email?: string
    phone?: string
    company?: string
    jobTitle?: string
    location?: string
  }
): Promise<EnrichmentResult> {
  // Skip enrichment if we have no meaningful identifiers
  const hasIdentifiers = buyer.name || buyer.email || buyer.company
  if (!hasIdentifiers) {
    console.log('[Enrichment] Skipping — no meaningful buyer identifiers')
    return EMPTY_RESULT
  }

  const prompt = buildEnrichmentPrompt(buyer)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 10,
        } as any,
      ],
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text from the response (may include tool_use blocks)
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )
    const fullText = textBlocks.map(b => b.text).join('\n')

    if (!fullText.trim()) {
      console.log('[Enrichment] Empty response from Claude')
      return EMPTY_RESULT
    }

    return parseEnrichmentResponse(fullText)
  } catch (err) {
    console.error('[Enrichment] Web search enrichment failed:', err)
    return EMPTY_RESULT
  }
}

/**
 * Converts enrichment result to a human-readable string
 * suitable for storage in background_research field.
 */
export function enrichmentToText(result: EnrichmentResult): string {
  // Only discard if truly empty or the default "no enrichment" message
  if (!result.rawSummary || result.rawSummary === 'No enrichment data was available for this buyer.') {
    return ''
  }
  return result.rawSummary
}
