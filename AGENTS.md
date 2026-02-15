# AGENTS.md - Agent Instructions for Naybourhood AI

Read this file before making any changes. Also read `/UI_STANDARDS.md` and `/docs/coding-standards.md`.

## Architecture

- **Framework**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Auth**: Supabase Auth (implicit flow, magic links, PKCE)
- **Scoring**: Custom rule-based AI scoring in `/lib/scoring/`
- **Billing**: Stripe (checkout, webhooks, customer portal)
- **Hosting**: Vercel

## Directory Structure

```
app/                    # Next.js App Router pages
  admin/                # Admin dashboard (super admin role)
  developer/            # Developer/housebuilder dashboard
  agent/                # Estate agent dashboard
  broker/               # Mortgage broker dashboard
  api/                  # API routes
  auth/                 # Auth callback handler
components/             # React components
  badges/               # ClassificationBadge, StatusBadge, PaymentBadge, NextActionChip
  leads/                # LeadTable, LeadDetail, LeadFilters, LeadIntakeForm
  scoring/              # ScoreDisplay, ScoreBar
  ui/                   # shadcn/ui base components + NBScoreRing
  shared/               # BuyerCardGrid, SettingsPage
  kyc/                  # KYC verification components
  ai/                   # AI insights, campaign analysis
hooks/                  # React hooks (useLeads, useDashboardStats, useUsers, etc.)
lib/                    # Utilities
  scoring/              # Scoring engine (Quality, Intent, Confidence, Classification)
  supabase/             # Supabase client (server, client, middleware)
  auth/                 # Auth config (roles, routes, permissions)
types/                  # TypeScript interfaces (Buyer, Lead, Company, etc.)
contexts/               # React contexts (AuthContext)
supabase/migrations/    # SQL migration files
```

## User Roles

4 roles with separate dashboards:
- **admin** (`/admin`): Full system access, all companies
- **developer** (`/developer`): Housebuilder dashboard, their company only
- **agent** (`/agent`): Estate agent dashboard, their company only
- **broker** (`/broker`): Mortgage broker dashboard, their company only

Internal team (`@naybourhood.ai` emails) and master admins have full access across all companies.

## Auth Pattern for API Routes

All protected API routes MUST follow this exact pattern:

```typescript
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const supabase = createClient()

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 2. Get profile for company scoping
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_type, company_id, is_internal_team')
    .eq('id', user.id)
    .single()

  // 3. Scope data by company
  const isAdmin = userProfile?.user_type === 'admin' || userProfile?.is_internal_team === true
  // Non-admins only see their company's data
}
```

Reference implementation: `/app/api/leads/route.ts`

**NEVER** use `createClient` from `@supabase/supabase-js` directly in API routes. Always use `createClient` from `@/lib/supabase/server` which includes the user's auth session.

## Scoring System

The NB Score is the primary metric. Three sub-scores feed into it:

- **Quality Score** (0-100): Profile completeness, financial qualification, verification, inventory fit
- **Intent Score** (0-100): Timeline urgency, purchase purpose, engagement level, commitment signals
- **Confidence Score** (0-10): Data completeness, verification level, engagement data, notes quality

**NB Score** = `quality * 0.5 + intent * 0.3 + (confidence / 10 * 100) * 0.2`

**Classifications** (from scoring engine):
- Hot, Warm-Qualified, Warm-Engaged, Nurture-Premium, Nurture-Standard, Cold, Disqualified, Spam

**Display classifications** (simplified for UI):
- Hot Lead, Qualified, Needs Qualification, Nurture, Low Priority, Disqualified

**Priority levels**: P1 (< 1 hour), P2 (< 4 hours), P3 (< 24 hours), P4 (48+ hours)

Scoring engine: `/lib/scoring/index.ts` and `/lib/scoring/naybourhood-scoring.ts`

## Data Scoping Rules

- Non-admin users MUST only see data from their own `company_id`
- Admin and internal team users can see all companies
- Every query that returns company-specific data must filter by `company_id`
- RPC functions accept `p_company_id` parameter for scoping

## Public vs Protected Routes

Defined in `/lib/auth/config.ts`:
- Public: `/`, `/login`, `/auth`, `/onboarding`, `/signup`, `/select-plan`
- Public API: `/api/auth/*`, `/api/billing/stripe-webhook`, `/api/stripe/webhook`, `/api/kyc/webhook`, `/api/v1/*`, `/api/waitlist`
- Protected: `/admin/*`, `/developer/*`, `/agent/*`, `/broker/*`
- All other API routes require authentication (handled per-route)

## Rules

1. Components must be under 300 lines. Split if larger.
2. No `.select('*')` — always specify columns.
3. No `console.log` in production code. Use `if (process.env.NODE_ENV === 'development')` for debug logs.
4. No inline styles — use Tailwind classes.
5. No `any` types — define proper TypeScript interfaces.
6. Every async operation must have try/catch with user-facing error handling.
7. Never commit `.env` or credential files.
8. All data fetching uses hooks in `/hooks/`, never direct Supabase calls in components.
9. Mutations must invalidate cache on success, show toast on error, clear loading in `finally`.
10. All filtering and sorting at database level, not client-side.
