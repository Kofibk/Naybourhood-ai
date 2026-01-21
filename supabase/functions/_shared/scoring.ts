/**
 * Naybourhood Scoring API - Scoring Engine
 *
 * Universal scoring logic for all leads.
 * This is the SINGLE SOURCE OF TRUTH for all scoring across the platform.
 *
 * Scoring Hierarchy:
 * 1. Financial Proceedability (highest priority)
 * 2. Commitment Signals (purchase purpose)
 * 3. Data Quality
 */

import type {
  ScoreRequest,
  Classification,
  Priority,
  QualityResult,
  IntentResult,
  ConfidenceResult,
  ScoringResult,
  ScoreBreakdown,
  MODEL_VERSION,
} from './types.ts';

// ═══════════════════════════════════════════════════════════════════
// QUALITY SCORE (0-100) - "Can they complete?"
// ═══════════════════════════════════════════════════════════════════

function calculateQualityScore(lead: ScoreRequest): QualityResult {
  const breakdown: ScoreBreakdown[] = [];
  let total = 0;

  const budgetMin = lead.requirements?.budget_min || 0;
  const budgetMax = lead.requirements?.budget_max || budgetMin;
  const bedrooms = lead.requirements?.bedrooms;
  const paymentMethod = (lead.financial?.payment_method || '').toLowerCase();
  const purchasePurpose = (lead.requirements?.purchase_purpose || '').toLowerCase();
  const connectToBroker = lead.financial?.connect_to_broker;

  // ══════════════════════════════════════════════════════════════════
  // DISQUALIFICATION CHECK
  // Budget >= £2M AND bedrooms <= 1 → Disqualify
  // ══════════════════════════════════════════════════════════════════

  const budget = budgetMax || budgetMin;
  if (budget >= 2000000 && bedrooms !== undefined && bedrooms <= 1) {
    return {
      total: 0,
      breakdown: [
        {
          factor: 'Auto-Disqualification',
          points: 0,
          reason: 'Budget £2M+ with studio/1-bed is unrealistic - likely fake lead',
        },
      ],
      isDisqualified: true,
      disqualificationReason: 'Budget £2M+ with studio/1-bed preference is unrealistic',
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // PAYMENT METHOD (max 30 points)
  // ══════════════════════════════════════════════════════════════════

  if (paymentMethod === 'cash') {
    total += 30;
    breakdown.push({
      factor: 'Cash Buyer',
      points: 30,
      reason: 'Cash buyer - highest financial proceedability',
    });
  } else if (paymentMethod === 'mortgage') {
    if (connectToBroker === true) {
      // Mortgage + wants broker connection
      total += 15;
      breakdown.push({
        factor: 'Mortgage + Wants Broker',
        points: 15,
        reason: 'Mortgage buyer seeking broker connection - opportunity for service',
      });
    } else if (connectToBroker === false) {
      // Mortgage + no broker needed (already has one)
      total += 20;
      breakdown.push({
        factor: 'Mortgage + Has Broker',
        points: 20,
        reason: 'Mortgage buyer with existing broker - ready to proceed',
      });
    } else {
      // Mortgage with unknown broker status
      total += 10;
      breakdown.push({
        factor: 'Mortgage Buyer',
        points: 10,
        reason: 'Mortgage buyer - broker status unknown',
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PURCHASE PURPOSE (max 15 points)
  // ══════════════════════════════════════════════════════════════════

  if (purchasePurpose === 'primary_residence') {
    total += 15;
    breakdown.push({
      factor: 'Primary Residence',
      points: 15,
      reason: 'Buying as primary residence - high commitment',
    });
  } else if (purchasePurpose === 'dependent_studying') {
    total += 15;
    breakdown.push({
      factor: 'Dependent Studying',
      points: 15,
      reason: 'Buying for dependent studying - specific need with timeline',
    });
  } else if (purchasePurpose === 'investment') {
    total += 10;
    breakdown.push({
      factor: 'Investment',
      points: 10,
      reason: 'Investment purchase',
    });
  } else if (purchasePurpose === 'holiday_home') {
    total += 5;
    breakdown.push({
      factor: 'Holiday/Second Home',
      points: 5,
      reason: 'Holiday or second home purchase - lower urgency',
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // DATA QUALITY (max 10 points)
  // Complete context = +10
  // ══════════════════════════════════════════════════════════════════

  const hasContext =
    lead.context?.development_name ||
    lead.context?.channel ||
    lead.context?.source_campaign;

  if (hasContext) {
    total += 10;
    breakdown.push({
      factor: 'Complete Context',
      points: 10,
      reason: 'Development/channel/campaign context provided',
    });
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown,
    isDisqualified: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// INTENT SCORE (0-100) - "How urgent?"
// ═══════════════════════════════════════════════════════════════════

function calculateIntentScore(lead: ScoreRequest): IntentResult {
  const breakdown: ScoreBreakdown[] = [];
  let total = 0;
  let is28DayBuyer = false;

  const buyingWithin28Days = lead.financial?.buying_within_28_days;
  const timeline = (lead.requirements?.timeline || '').toLowerCase();
  const purchasePurpose = (lead.requirements?.purchase_purpose || '').toLowerCase();
  const connectToBroker = lead.financial?.connect_to_broker;
  const channel = (lead.context?.channel || '').toLowerCase();

  // ══════════════════════════════════════════════════════════════════
  // 28-DAY PURCHASE INTENT (HARD RULE) - +40 points
  // ══════════════════════════════════════════════════════════════════

  if (buyingWithin28Days === true) {
    total += 40;
    is28DayBuyer = true;
    breakdown.push({
      factor: '28-Day Purchase Intent',
      points: 40,
      reason: 'HARD RULE: Ready to purchase within 28 days - automatically Hot Lead',
    });
  } else {
    // Check timeline string for urgency indicators
    if (/3.?month|1-3|2-3|short|soon/i.test(timeline)) {
      total += 25;
      breakdown.push({
        factor: 'Timeline: 3 Months',
        points: 25,
        reason: 'Looking to purchase within 3 months',
      });
    } else if (/6.?month|3-6|half/i.test(timeline)) {
      total += 5;
      breakdown.push({
        factor: 'Timeline: 6 Months',
        points: 5,
        reason: 'Timeline 6+ months - lower urgency',
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PURCHASE PURPOSE (max 25 points)
  // ══════════════════════════════════════════════════════════════════

  if (purchasePurpose === 'dependent_studying') {
    total += 25;
    breakdown.push({
      factor: 'Dependent Studying',
      points: 25,
      reason: 'Buying for dependent studying - specific timeline requirement',
    });
  } else if (purchasePurpose === 'primary_residence') {
    total += 20;
    breakdown.push({
      factor: 'Primary Residence',
      points: 20,
      reason: 'Primary residence purchase - genuine need',
    });
  } else if (purchasePurpose === 'investment') {
    total += 10;
    breakdown.push({
      factor: 'Investment',
      points: 10,
      reason: 'Investment purchase',
    });
  } else if (purchasePurpose === 'holiday_home') {
    total += 5;
    breakdown.push({
      factor: 'Holiday/Second Home',
      points: 5,
      reason: 'Holiday or second home - less urgent',
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // COMMITMENT SIGNALS (max 10 points)
  // ══════════════════════════════════════════════════════════════════

  if (connectToBroker === true) {
    total += 10;
    breakdown.push({
      factor: 'Wants Broker Connection',
      points: 10,
      reason: 'Actively seeking broker connection - shows intent to proceed',
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // CHANNEL/SOURCE (max 10 points)
  // ══════════════════════════════════════════════════════════════════

  if (channel === 'form' || channel === 'website') {
    total += 10;
    breakdown.push({
      factor: 'Source: Form/Website',
      points: 10,
      reason: 'Direct inquiry via form - deliberate action',
    });
  } else if (channel === 'whatsapp') {
    total += 5;
    breakdown.push({
      factor: 'Source: WhatsApp',
      points: 5,
      reason: 'WhatsApp inquiry - engaged but informal',
    });
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown,
    is28DayBuyer,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONFIDENCE SCORE (0-100) - "Data completeness"
// ═══════════════════════════════════════════════════════════════════

function calculateConfidenceScore(lead: ScoreRequest): ConfidenceResult {
  const breakdown: ScoreBreakdown[] = [];
  let total = 0;

  // Core fields to check (5 fields, 20 points each)
  const fields = [
    {
      name: 'Budget',
      hasValue: !!(lead.requirements?.budget_min || lead.requirements?.budget_max),
    },
    {
      name: 'Bedrooms',
      hasValue: lead.requirements?.bedrooms !== undefined,
    },
    {
      name: 'Purchase Purpose',
      hasValue: !!lead.requirements?.purchase_purpose,
    },
    {
      name: 'Payment Method',
      hasValue: !!lead.financial?.payment_method,
    },
    {
      name: 'Timeline',
      hasValue:
        !!lead.requirements?.timeline || lead.financial?.buying_within_28_days !== undefined,
    },
  ];

  for (const field of fields) {
    if (field.hasValue) {
      total += 20;
      breakdown.push({
        factor: field.name,
        points: 20,
        reason: `${field.name} provided`,
      });
    }
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFICATION RULES (in order of priority)
// ═══════════════════════════════════════════════════════════════════

function determineClassification(
  quality: QualityResult,
  intent: IntentResult,
  confidence: ConfidenceResult
): Classification {
  // 1. DISQUALIFIED: Auto-disqualified leads
  if (quality.isDisqualified) {
    return 'disqualified';
  }

  // 2. HOT LEAD: 28-day buyer (HARD RULE)
  if (intent.is28DayBuyer) {
    return 'hot_lead';
  }

  // 3. HOT LEAD: Quality >= 70 AND Intent >= 70 AND Confidence >= 60
  if (quality.total >= 70 && intent.total >= 70 && confidence.total >= 60) {
    return 'hot_lead';
  }

  // 4. QUALIFIED: Quality >= 60 AND Intent >= 50 AND Confidence >= 50
  if (quality.total >= 60 && intent.total >= 50 && confidence.total >= 50) {
    return 'qualified';
  }

  // 5. NEEDS QUALIFICATION: Confidence < 50
  if (confidence.total < 50) {
    return 'needs_qualification';
  }

  // 6. NURTURE: Intent < 50 AND Quality >= 50
  if (intent.total < 50 && quality.total >= 50) {
    return 'nurture';
  }

  // 7. DEFAULT: Low Priority
  return 'low_priority';
}

// ═══════════════════════════════════════════════════════════════════
// PRIORITY MAPPING
// ═══════════════════════════════════════════════════════════════════

function determinePriority(classification: Classification): Priority {
  switch (classification) {
    case 'hot_lead':
      return 'high';
    case 'qualified':
      return 'high';
    case 'needs_qualification':
      return 'medium';
    case 'nurture':
      return 'low';
    case 'low_priority':
      return 'low';
    case 'disqualified':
      return 'none';
    default:
      return 'low';
  }
}

// ═══════════════════════════════════════════════════════════════════
// RISK FLAGS
// ═══════════════════════════════════════════════════════════════════

function generateRiskFlags(lead: ScoreRequest, quality: QualityResult): string[] {
  const flags: string[] = [];

  const budgetMin = lead.requirements?.budget_min || 0;
  const budgetMax = lead.requirements?.budget_max || budgetMin;
  const budget = budgetMax || budgetMin;
  const bedrooms = lead.requirements?.bedrooms;
  const paymentMethod = (lead.financial?.payment_method || '').toLowerCase();
  const connectToBroker = lead.financial?.connect_to_broker;
  const purchasePurpose = (lead.requirements?.purchase_purpose || '').toLowerCase();
  const timeline = (lead.requirements?.timeline || '').toLowerCase();

  // Likely fake lead: £2M+ with studio/1-bed
  if (budget >= 2000000 && bedrooms !== undefined && bedrooms <= 1) {
    flags.push('likely_fake_lead');
  }

  // No finance confirmation: Mortgage buyer without broker
  if (paymentMethod === 'mortgage' && connectToBroker === false) {
    flags.push('no_finance_confirmation');
  }

  // Low urgency: Holiday home with 6+ month timeline
  if (
    purchasePurpose === 'holiday_home' &&
    /6.?month|12.?month|year/i.test(timeline)
  ) {
    flags.push('low_urgency');
  }

  // Incomplete profile: Missing budget OR purchase_purpose OR payment_method
  if (!lead.requirements?.budget_min && !lead.requirements?.budget_max) {
    flags.push('incomplete_profile');
  } else if (!lead.requirements?.purchase_purpose) {
    flags.push('incomplete_profile');
  } else if (!lead.financial?.payment_method) {
    flags.push('incomplete_profile');
  }

  // Time sensitive visa: Dependent studying (positive flag - needs fast action)
  if (purchasePurpose === 'dependent_studying') {
    flags.push('time_sensitive_visa');
  }

  return [...new Set(flags)]; // Remove duplicates
}

// ═══════════════════════════════════════════════════════════════════
// NEXT ACTION
// ═══════════════════════════════════════════════════════════════════

function determineNextAction(classification: Classification): string {
  switch (classification) {
    case 'hot_lead':
      return 'Schedule viewing within 24 hours';
    case 'qualified':
      return 'Send development brochure + follow up in 48 hours';
    case 'needs_qualification':
      return 'WhatsApp to confirm budget, timeline, and requirements';
    case 'nurture':
      return 'Add to 3-month email sequence';
    case 'low_priority':
      return 'Monitor for re-engagement';
    case 'disqualified':
      return 'Archive - do not pursue';
    default:
      return 'Review manually';
  }
}

// ═══════════════════════════════════════════════════════════════════
// SUMMARY GENERATION
// ═══════════════════════════════════════════════════════════════════

function generateSummary(
  lead: ScoreRequest,
  classification: Classification,
  intent: IntentResult
): string {
  const parts: string[] = [];

  // Payment method
  const paymentMethod = (lead.financial?.payment_method || '').toLowerCase();
  const paymentLabel = paymentMethod === 'cash' ? 'Cash buyer' : 'Mortgage buyer';
  parts.push(paymentLabel);

  // Budget
  const budgetMin = lead.requirements?.budget_min;
  const budgetMax = lead.requirements?.budget_max;
  if (budgetMin || budgetMax) {
    const formatBudget = (n: number) => {
      if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}M`;
      if (n >= 1000) return `£${Math.round(n / 1000)}K`;
      return `£${n}`;
    };
    if (budgetMin && budgetMax && budgetMin !== budgetMax) {
      parts.push(`with ${formatBudget(budgetMin)}-${formatBudget(budgetMax)} budget`);
    } else {
      parts.push(`with ${formatBudget(budgetMax || budgetMin || 0)} budget`);
    }
  }

  // Bedrooms
  const bedrooms = lead.requirements?.bedrooms;
  if (bedrooms) {
    parts.push(`looking for ${bedrooms}-bed`);
  }

  // Purpose
  const purpose = lead.requirements?.purchase_purpose;
  if (purpose) {
    const purposeMap: Record<string, string> = {
      primary_residence: 'for primary residence',
      dependent_studying: 'for dependent studying',
      investment: 'for investment',
      holiday_home: 'as holiday home',
    };
    parts.push(purposeMap[purpose] || `for ${purpose}`);
  }

  // Timeline statement
  if (intent.is28DayBuyer) {
    parts.push('. Ready to purchase within 28 days');
  } else if (lead.requirements?.timeline) {
    parts.push(`. Timeline: ${lead.requirements.timeline}`);
  }

  // Assessment
  const assessmentMap: Record<Classification, string> = {
    hot_lead: '. High proceedability - prioritise for immediate viewing',
    qualified: '. Good prospect - schedule follow-up',
    needs_qualification: '. Requires qualification - confirm key details',
    nurture: '. Long-term prospect - add to nurture sequence',
    low_priority: '. Low priority - monitor for re-engagement',
    disqualified: '. Disqualified - do not pursue',
  };
  parts.push(assessmentMap[classification]);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function scoreLead(lead: ScoreRequest): ScoringResult {
  // Calculate component scores
  const quality = calculateQualityScore(lead);
  const intent = calculateIntentScore(lead);
  const confidence = calculateConfidenceScore(lead);

  // Determine classification and priority
  const classification = determineClassification(quality, intent, confidence);
  const priority = determinePriority(classification);

  // Generate risk flags, next action, and summary
  const riskFlags = generateRiskFlags(lead, quality);
  const nextAction = determineNextAction(classification);
  const summary = generateSummary(lead, classification, intent);

  return {
    quality,
    intent,
    confidence,
    classification,
    priority,
    riskFlags,
    nextAction,
    summary,
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT SCORE RESULT FOR DATABASE
// ═══════════════════════════════════════════════════════════════════

export function scoringResultToDbRow(
  lead: ScoreRequest,
  result: ScoringResult,
  customerId: string,
  scoreTimeMs: number
) {
  return {
    customer_id: customerId,
    external_id: lead.external_id,
    external_source: lead.external_source || 'api',

    // Buyer
    buyer_country: lead.buyer?.country || null,
    buyer_region: lead.buyer?.region || null,

    // Requirements
    budget_min: lead.requirements?.budget_min || null,
    budget_max: lead.requirements?.budget_max || null,
    bedrooms: lead.requirements?.bedrooms || null,
    preferred_location: lead.requirements?.preferred_location || null,
    purchase_purpose: lead.requirements?.purchase_purpose || null,
    timeline: lead.requirements?.timeline || null,

    // Financial
    payment_method: lead.financial?.payment_method || null,
    connect_to_broker: lead.financial?.connect_to_broker ?? null,
    buying_within_28_days: lead.financial?.buying_within_28_days ?? null,

    // Context
    development_id: lead.context?.development_id || null,
    development_name: lead.context?.development_name || null,
    channel: lead.context?.channel || null,
    source_campaign: lead.context?.source_campaign || null,
    input_payload: lead as Record<string, unknown>,

    // Scores
    quality_score: result.quality.total,
    intent_score: result.intent.total,
    confidence_score: result.confidence.total,
    classification: result.classification,
    priority: result.priority,
    risk_flags: result.riskFlags,
    next_action: result.nextAction,
    summary: result.summary,

    // Metadata
    model_version: '1.0',
    score_time_ms: scoreTimeMs,
    scored_at: new Date().toISOString(),
  };
}
