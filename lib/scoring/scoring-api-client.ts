/**
 * Naybourhood Scoring API Client
 *
 * Use this client to interact with the universal scoring API from your
 * Naybourhood frontend or backend code.
 *
 * Example usage:
 *
 * ```typescript
 * import { ScoringApiClient } from '@/lib/scoring/scoring-api-client';
 *
 * const client = new ScoringApiClient({
 *   baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
 *   apiKey: process.env.SCORING_API_KEY,
 * });
 *
 * const score = await client.scoreLead({
 *   external_id: buyerId,
 *   requirements: { budget_min: 600000, bedrooms: 2 },
 *   financial: { payment_method: 'cash', buying_within_28_days: true },
 * });
 * ```
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ScoreRequest {
  external_id: string;
  external_source?: string;
  buyer?: {
    country?: string;
    region?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  requirements?: {
    budget_min?: number;
    budget_max?: number;
    bedrooms?: number;
    preferred_location?: string;
    purchase_purpose?: string;
    timeline?: string;
  };
  financial?: {
    payment_method?: string;
    connect_to_broker?: boolean;
    buying_within_28_days?: boolean;
    proof_of_funds?: boolean;
    mortgage_status?: string;
  };
  context?: {
    development_id?: string;
    development_name?: string;
    channel?: string;
    source_campaign?: string;
  };
}

export interface ScoreResponse {
  id: string;
  external_id: string;
  scores: {
    quality_score: number;
    intent_score: number;
    confidence_score: number;
  };
  classification:
    | 'hot_lead'
    | 'qualified'
    | 'needs_qualification'
    | 'nurture'
    | 'low_priority'
    | 'disqualified';
  priority: 'high' | 'medium' | 'low' | 'none';
  risk_flags: string[];
  next_action: string;
  summary: string;
  model_version: string;
  scored_at: string;
}

export interface BatchScoreResponse {
  results: ScoreResponse[];
  processed: number;
  errors: Array<{ external_id: string; error: string }>;
}

export interface OutcomeRequest {
  external_id: string;
  external_source?: string;
  status: 'converted' | 'lost' | 'disqualified' | 'stale';
  reason?: string;
  value?: number;
}

export interface OutcomeResponse {
  success: boolean;
  id: string;
  external_id: string;
  days_to_outcome: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface ScoringApiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════
// CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════

export class ScoringApiClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ScoringApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // 30 second default
  }

  /**
   * Make an authenticated request to the scoring API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/functions/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check API health (no auth required)
   */
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/functions/v1/health`);
    return response.json();
  }

  /**
   * Score a single lead
   */
  async scoreLead(lead: ScoreRequest): Promise<ScoreResponse> {
    return this.request<ScoreResponse>('/score', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  /**
   * Score multiple leads (max 100)
   */
  async scoreLeads(leads: ScoreRequest[]): Promise<BatchScoreResponse> {
    return this.request<BatchScoreResponse>('/score-batch', {
      method: 'POST',
      body: JSON.stringify({ leads }),
    });
  }

  /**
   * Get an existing score by external ID
   */
  async getScore(
    externalId: string,
    source: string = 'api'
  ): Promise<ScoreResponse> {
    return this.request<ScoreResponse>(
      `/score-get/${encodeURIComponent(externalId)}?source=${encodeURIComponent(source)}`,
      { method: 'GET' }
    );
  }

  /**
   * Update a lead with its outcome
   */
  async recordOutcome(outcome: OutcomeRequest): Promise<OutcomeResponse> {
    return this.request<OutcomeResponse>('/outcome', {
      method: 'POST',
      body: JSON.stringify(outcome),
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════

let clientInstance: ScoringApiClient | null = null;

/**
 * Get the scoring API client singleton
 * Requires SCORING_API_KEY environment variable to be set
 */
export function getScoringApiClient(): ScoringApiClient {
  if (clientInstance) {
    return clientInstance;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.SCORING_API_KEY || process.env.NAYBOURHOOD_SCORING_API_KEY;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }

  if (!apiKey) {
    throw new Error('SCORING_API_KEY environment variable is not set');
  }

  clientInstance = new ScoringApiClient({
    baseUrl,
    apiKey,
  });

  return clientInstance;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert a Buyer object (from the database) to a ScoreRequest
 */
export function buyerToScoreRequest(buyer: {
  id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  nationality?: string;
  budget?: number | string;
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number;
  preferred_bedrooms?: number;
  location?: string;
  area?: string;
  purchase_purpose?: string;
  purpose?: string;
  timeline?: string;
  timeline_to_purchase?: string;
  payment_method?: string;
  uk_broker?: string;
  connect_to_broker?: boolean;
  ready_within_28_days?: boolean;
  ready_in_28_days?: boolean;
  development_name?: string;
  source?: string;
  campaign?: string;
}): ScoreRequest {
  // Determine connect_to_broker from uk_broker field
  let connectToBroker: boolean | undefined;
  if (buyer.connect_to_broker !== undefined) {
    connectToBroker = buyer.connect_to_broker;
  } else if (buyer.uk_broker) {
    const ukBroker = buyer.uk_broker.toLowerCase();
    if (['no', 'unknown', 'false'].includes(ukBroker)) {
      connectToBroker = true; // They need a broker
    } else if (['yes', 'introduced', 'true'].includes(ukBroker)) {
      connectToBroker = false; // They already have one
    }
  }

  // Parse budget if it's a string
  let budgetMin = buyer.budget_min;
  let budgetMax = buyer.budget_max;
  if (!budgetMin && buyer.budget) {
    if (typeof buyer.budget === 'number') {
      budgetMin = buyer.budget;
    } else if (typeof buyer.budget === 'string') {
      const parsed = parseInt(buyer.budget.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) {
        budgetMin = parsed;
      }
    }
  }

  return {
    external_id: buyer.id,
    external_source: 'naybourhood',
    buyer: {
      country: buyer.country || buyer.nationality,
      name: buyer.full_name || [buyer.first_name, buyer.last_name].filter(Boolean).join(' '),
      email: buyer.email,
      phone: buyer.phone,
    },
    requirements: {
      budget_min: budgetMin,
      budget_max: budgetMax || budgetMin,
      bedrooms: buyer.bedrooms || buyer.preferred_bedrooms,
      preferred_location: buyer.location || buyer.area,
      purchase_purpose: buyer.purchase_purpose || buyer.purpose,
      timeline: buyer.timeline || buyer.timeline_to_purchase,
    },
    financial: {
      payment_method: buyer.payment_method,
      connect_to_broker: connectToBroker,
      buying_within_28_days: buyer.ready_within_28_days || buyer.ready_in_28_days,
    },
    context: {
      development_name: buyer.development_name,
      channel: buyer.source,
      source_campaign: buyer.campaign,
    },
  };
}

/**
 * Map API classification to display format
 */
export function formatClassification(classification: ScoreResponse['classification']): string {
  const map: Record<ScoreResponse['classification'], string> = {
    hot_lead: 'Hot Lead',
    qualified: 'Qualified',
    needs_qualification: 'Needs Qualification',
    nurture: 'Nurture',
    low_priority: 'Low Priority',
    disqualified: 'Disqualified',
  };
  return map[classification] || classification;
}

/**
 * Map API priority to display format (P1-P4)
 */
export function formatPriority(priority: ScoreResponse['priority']): string {
  const map: Record<ScoreResponse['priority'], string> = {
    high: 'P1',
    medium: 'P2',
    low: 'P3',
    none: 'P4',
  };
  return map[priority] || 'P3';
}
