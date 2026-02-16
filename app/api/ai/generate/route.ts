import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return null
  }
  return new Anthropic({ apiKey })
}

export interface GenerateRequest {
  type: 'lead_summary' | 'lead_recommendations' | 'dashboard_insights' | 'next_action'
  data: any
}

export interface GenerateResponse {
  success: boolean
  content?: any
  error?: string
}

// Generate AI content for a single lead
async function generateLeadContent(client: Anthropic, lead: any): Promise<any> {
  const prompt = `You are a real estate CRM AI assistant. Analyze this buyer lead and provide insights.

BUYER DATA:
- Name: ${lead.full_name || lead.first_name || 'Unknown'}
- Email: ${lead.email || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}
- Country: ${lead.country || 'Not specified'}
- Budget: ${lead.budget || lead.budget_range || 'Not specified'}
- Payment Method: ${lead.payment_method || 'Unknown'}
- Mortgage Status: ${lead.mortgage_status || 'N/A'}
- Timeline: ${lead.timeline || 'Not specified'}
- Location Preference: ${lead.location || lead.area || 'Not specified'}
- Bedrooms: ${lead.bedrooms || lead.preferred_bedrooms || 'Not specified'}
- Status: ${lead.status || 'New'}
- Proof of Funds: ${lead.proof_of_funds ? 'Yes' : 'No'}
- UK Broker: ${lead.uk_broker ? 'Yes' : 'No'}
- UK Solicitor: ${lead.uk_solicitor ? 'Yes' : 'No'}
- Source: ${lead.source || 'Unknown'}
- Notes: ${lead.notes || 'None'}

Respond in JSON format with these fields:
{
  "summary": "2-3 sentence buyer summary focusing on their readiness and potential",
  "nextAction": "Single specific action the sales team should take next",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "riskFlags": ["risk 1", "risk 2"] or [],
  "classification": "Hot" | "Warm-Qualified" | "Warm-Engaged" | "Nurture" | "Cold",
  "priority": "P1" | "P2" | "P3" | "P4",
  "qualityScore": number 0-100,
  "intentScore": number 0-100,
  "confidence": number 0-10
}

Be specific and actionable. Focus on real estate buying signals.`

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse Claude response')
}

// Generate dashboard insights based on all leads
async function generateDashboardInsights(client: Anthropic, leads: any[]): Promise<any> {
  // Summarize lead data for the prompt
  const totalLeads = leads.length
  const hotLeads = leads.filter(l => (l.quality_score || 0) >= 70).length
  const warmLeads = leads.filter(l => (l.quality_score || 0) >= 45 && (l.quality_score || 0) < 70).length
  const coldLeads = leads.filter(l => (l.quality_score || 0) < 45).length

  const cashBuyers = leads.filter(l => l.payment_method?.toLowerCase() === 'cash').length
  const mortgageBuyers = leads.filter(l => l.payment_method?.toLowerCase() === 'mortgage').length
  const withProofOfFunds = leads.filter(l => l.proof_of_funds).length

  const statusCounts: Record<string, number> = {}
  leads.forEach(l => {
    const status = l.status || 'Unknown'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  // Get top leads for context
  const topLeads = leads
    .filter(l => (l.quality_score || 0) >= 60)
    .slice(0, 5)
    .map(l => ({
      name: l.full_name || l.first_name,
      score: l.quality_score,
      status: l.status,
      budget: l.budget || l.budget_range,
      payment: l.payment_method,
    }))

  const prompt = `You are a real estate CRM AI assistant. Analyze this lead portfolio and provide actionable insights.

PORTFOLIO SUMMARY:
- Total Leads: ${totalLeads}
- Hot Leads (score >= 70): ${hotLeads}
- Warm Leads (score 45-69): ${warmLeads}
- Cold Leads (score < 45): ${coldLeads}

BUYER TYPES:
- Cash Buyers: ${cashBuyers}
- Mortgage Buyers: ${mortgageBuyers}
- With Proof of Funds: ${withProofOfFunds}

STATUS BREAKDOWN:
${Object.entries(statusCounts).map(([s, c]) => `- ${s}: ${c}`).join('\n')}

TOP PRIORITY LEADS:
${topLeads.map(l => `- ${l.name}: Score ${l.score}, ${l.status}, ${l.budget}, ${l.payment}`).join('\n')}

Generate 3-4 specific, actionable insights for the sales team. Each insight should:
1. Identify an opportunity or issue
2. Recommend a specific action
3. Indicate urgency (now, today, this week)

Respond in JSON format:
{
  "insights": [
    {
      "type": "opportunity" | "warning" | "action",
      "title": "Brief title",
      "description": "1-2 sentence description",
      "action": "Specific action to take",
      "urgency": "now" | "today" | "this_week",
      "leadIds": [] // optional, IDs of related leads
    }
  ],
  "summary": "One sentence overall portfolio health summary",
  "topPriority": "Single most important action right now"
}`

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse Claude response')
}

// Generate next action for a lead
async function generateNextAction(client: Anthropic, lead: any): Promise<string> {
  const prompt = `You are a real estate sales assistant. Based on this lead's current status, recommend the single most important next action.

Lead: ${lead.full_name || lead.first_name || 'Unknown'}
Status: ${lead.status || 'New'}
Payment: ${lead.payment_method || 'Unknown'}
Budget: ${lead.budget || lead.budget_range || 'Unknown'}
Timeline: ${lead.timeline || 'Unknown'}
Has Proof of Funds: ${lead.proof_of_funds ? 'Yes' : 'No'}
Has UK Broker: ${lead.uk_broker ? 'Yes' : 'No'}
Has UK Solicitor: ${lead.uk_solicitor ? 'Yes' : 'No'}
Last Contact: ${lead.last_contact || 'Never'}

Respond with a single, specific, actionable sentence (max 15 words). Focus on the immediate next step.`

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    return 'Follow up with lead to confirm interest'
  }

  return textContent.text.trim()
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
      }
    }

    const body: GenerateRequest = await request.json()
    const { type, data } = body

    const client = getAnthropicClient()

    if (!client) {
      // Fallback to basic responses if no API key
      console.log('[AI Generate] No Anthropic API key, using fallback')
      return NextResponse.json({
        success: true,
        content: getFallbackContent(type, data),
        fallback: true,
      })
    }

    let content: any

    switch (type) {
      case 'lead_summary':
        content = await generateLeadContent(client, data)
        break

      case 'dashboard_insights':
        content = await generateDashboardInsights(client, data.leads || [])
        break

      case 'next_action':
        content = { nextAction: await generateNextAction(client, data) }
        break

      case 'lead_recommendations':
        const leadContent = await generateLeadContent(client, data)
        content = {
          recommendations: leadContent.recommendations,
          riskFlags: leadContent.riskFlags,
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown generation type: ${type}`,
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      content,
    })
  } catch (error: any) {
    console.error('[AI Generate] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate AI content',
    }, { status: 500 })
  }
}

// Fallback content when no API key is available
function getFallbackContent(type: string, data: any): any {
  switch (type) {
    case 'lead_summary':
      return {
        summary: `${data.full_name || 'This lead'} is a ${data.payment_method || 'potential'} buyer looking in ${data.location || 'the area'}. Budget: ${data.budget || data.budget_range || 'Not specified'}.`,
        nextAction: 'Contact lead to confirm interest and timeline',
        recommendations: [
          'Verify contact information',
          'Confirm budget and timeline',
          'Schedule discovery call',
        ],
        riskFlags: [],
        classification: 'Nurture',
        priority: 'P3',
        qualityScore: 50,
        intentScore: 50,
        confidence: 5,
      }

    case 'dashboard_insights':
      const leads = data.leads || []
      const hotCount = leads.filter((l: any) => (l.quality_score || 0) >= 70).length
      return {
        insights: [
          {
            type: 'action',
            title: `${hotCount} Hot Leads Need Attention`,
            description: `You have ${hotCount} high-scoring leads that should be contacted today.`,
            action: 'Review and contact hot leads',
            urgency: 'today',
          },
        ],
        summary: `${leads.length} leads in pipeline, ${hotCount} are hot.`,
        topPriority: 'Contact your highest-scoring leads today',
      }

    case 'next_action':
      return {
        nextAction: 'Follow up to confirm interest and availability',
      }

    case 'lead_recommendations':
      return {
        recommendations: [
          'Verify buyer credentials',
          'Confirm purchase timeline',
          'Schedule property viewing',
        ],
        riskFlags: [],
      }

    default:
      return {}
  }
}
