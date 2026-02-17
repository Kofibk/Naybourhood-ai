# Codebase Audit Report — Naybourhood AI

**Date:** 2026-02-17
**Branch:** claude/audit-codebase-agents-UafiK
**Purpose:** Audit existing codebase before building new features

---

## 1. Design System Confirmed

Reference docs: `AGENTS.md`, `UI_STANDARDS.md`, `docs/coding-standards.md`

- **Theme:** Giga-inspired dark mode (default)
- **Colours:** Background `#0A0A0A`, Surface `#171717`, Accent `#34D399` (Emerald), Warning `#FBBF24`, Info `#60A5FA`, Destructive `#EF4444`
- **Font:** Inter, weights 300-700
- **Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Database:** Supabase (PostgreSQL) with RLS
- **Auth:** Supabase Auth (implicit flow, magic links)
- **Hosting:** Vercel

---

## 2. Route Map

### Working Pages (~15)

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page with waitlist |
| `/login` | Password + magic link auth |
| `/signup` | Account creation |
| `/onboarding` | 6-step OnboardingWizard |
| `/onboarding/setup` | SetupWizard |
| `/select-plan` | Stripe plan selection |
| `/reset-password` | Password reset |
| `/demo` | Demo mode entry |
| `/auth/expired` | Expired link error |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/admin` | Full admin dashboard with KPIs |
| `/admin/leads` | Advanced lead management table |
| `/admin/campaigns` | Campaign management |
| `/admin/analytics` | Analytics dashboard |
| `/admin/users` | User management with invites |

### Template Pages (~5)

| Route | Description |
|-------|-------------|
| `/agent` | Shared DashboardPage template |
| `/agent/insights` | Company-filtered AI insights |
| `/developer` | Shared DashboardPage template |
| `/developer/insights` | Company-filtered AI insights |
| `/developer/buyers` | LeadManagementPage in property mode |

### Skeleton/Placeholder Pages (~55)

All remaining routes under `/admin/*`, `/agent/*`, `/broker/*`, `/developer/*` exist as files but have minimal or no implementation.

---

## 3. Supabase Connection

### Client Setup

| File | Type | Notes |
|------|------|-------|
| `lib/supabase/client.ts` | Browser | `@supabase/ssr`, implicit flow |
| `lib/supabase/server.ts` | Server + Admin | Cookie-based sessions, service role for RLS bypass |
| `lib/supabase/middleware.ts` | Middleware | Session refresh via `getUser()` |

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only)
- `NEXT_PUBLIC_APP_URL` — App URL for callbacks

### RLS

- Standard queries use authenticated client (RLS enforced)
- Admin operations use `createAdminClient()` to bypass RLS
- Company scoping via `company_id` on all non-admin queries
- Middleware checks `user_profiles.user_type` and `companies.enabled_features`

**Status: Solid implementation, follows best practices.**

---

## 4. Onboarding Flow

### Current 6-Step Wizard

| Step | Component | Covers |
|------|-----------|--------|
| 1 | WelcomeStep | User type, job role, personal info |
| 2 | CompanyStep | Company name/website, match or create |
| 3 | BusinessConfigStep | Role-specific business setup |
| 4 | TeamInvitesStep | Email invites with role assignment |
| 5 | PipelineImportStep | CSV lead import |
| 6 | LeadSourcesStep / CompleteStep | Lead sources + success redirect |

### Database Fields

- `user_profiles.onboarding_step` (INTEGER, default 1)
- `user_profiles.onboarding_completed` (BOOLEAN, default false)
- `user_profiles.onboarding_completed_at` (TIMESTAMPTZ)

### Missing

1. No email verification step
2. No KYC/AML integration (table exists, not wired)
3. No billing/payment step
4. No document upload
5. No T&C acceptance
6. No avatar upload
7. No admin approval flow for pending members
8. `onboarding_progress` table exists but is unused (dead code)
9. No post-completion checklist or reminder emails
10. No onboarding analytics/tracking

---

## 5. Existing Dashboard Components

### Dashboard Widgets (14 complete)

- ScoreBadge, LeadCard, ClassificationPill, RiskFlagBadge
- AgentStats, HotLeadsWidget, PriorityActions, PipelineOverview
- DevelopmentCard, MorningPriority, DevelopmentPerformance
- PipelineBoard (drag-drop Kanban), NextActionButton, NotificationBell

### Base UI Components (25+)

Full shadcn/ui library: Button (9 variants), Card, Badge (8 variants), Input, Label, Checkbox, DataTable, Table, Select, Dialog, Sheet, Tabs, Textarea, Alert, Progress, Avatar, Skeleton, ScrollArea, FilterBar, EmptyState, LoadingState, ConfirmDialog, PageHeader, EditableCell, NBScoreRing, ScoreIndicator, StatusBadge

### Needs Building

- BorrowerCard, MatchCard, ConversationThread, CompanyCard
- DevelopmentDetail, CampaignDetail, BillingDashboard
- SettingsForm, APIKeyManager, OutcomeTracker, ApprovalQueue

---

## 6. Phased Build Plan

### Phase A — Fix/Improve Existing (~40 file touches)

| # | Task | Complexity |
|---|------|-----------|
| A1 | Flesh out admin skeleton pages (users/[id], companies, developments, etc.) | Medium |
| A2 | Wire up or remove unused `onboarding_progress` table | Low |
| A3 | Add T&C acceptance to onboarding | Low |
| A4 | Add admin approval flow for pending company members | Medium |
| A5 | Complete developer dashboard | Medium |
| A6 | Complete agent dashboard | Medium |
| A7 | Add missing loading/error states | Low |
| A8 | Consider PKCE migration (implicit flow deprecated) | Medium |

### Phase B — Build New (~50-60 new files)

| # | Task | Complexity |
|---|------|-----------|
| B1 | Broker dashboard (all routes skeletal) | High |
| B2 | Conversation/messaging system | High |
| B3 | Property-buyer matching UI | Medium |
| B4 | Billing/subscription management | Medium |
| B5 | API key management UI | Low |
| B6 | Settings pages (profile, notifications) | Medium |
| B7 | Campaign detail page with analytics | Medium |
| B8 | Development detail page | Medium |
| B9 | Outcome tracking system | Medium |
| B10 | Admin AI analysis page | Medium |
| B11 | Onboarding analytics/tracking | Low |

### Phase C — Scope Estimate

| Category | Files to Modify | New Files | Total |
|----------|----------------|-----------|-------|
| Phase A | 25-35 | 5-10 | ~40 |
| Phase B | ~5 | 40-55 | ~50-60 |
| **Total** | **30-40** | **50-65** | **~90-100** |

### Recommended Order

1. Phase A — stabilise existing code
2. Phase B1-B2 — broker dashboard + conversations (highest impact)
3. Phase B3-B6 — matching, billing, API keys, settings
4. Phase B7-B11 — detail pages, outcomes, analytics

### Key Risks

- Implicit auth flow is deprecated by Supabase
- ~55 skeleton routes show empty pages to users
- Zero automated tests in the codebase
- `onboarding_progress` table is dead code
