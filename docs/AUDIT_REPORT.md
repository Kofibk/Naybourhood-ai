# Codebase Audit Report — Naybourhood AI

**Date:** 2026-02-17 (updated)
**Branch:** claude/audit-codebase-agents-UafiK
**Purpose:** Audit existing codebase, identify issues, and fix them

---

## 1. Design System — Confirmed

Reference docs: `AGENTS.md`, `UI_STANDARDS.md`, `docs/coding-standards.md`

- **Theme:** Giga-inspired dark mode (default)
- **Colours:** Background `#0A0A0A`, Surface `#171717`, Accent `#34D399` (Emerald), Warning `#FBBF24`, Info `#60A5FA`, Destructive `#EF4444`
- **Font:** Inter, weights 300-700
- **Framework:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Database:** Supabase (PostgreSQL) with RLS
- **Auth:** Supabase Auth (PKCE flow, magic links) — **FIXED: migrated from deprecated implicit flow**
- **Hosting:** Vercel

---

## 2. Route Map (CORRECTED)

Initial audit incorrectly classified ~55 routes as "skeletons". Deep analysis revealed most are either full implementations or proper delegates to shared components.

### Auth & Public Pages (11 routes) — All Working

| Route | Status |
|-------|--------|
| `/` | Full marketing landing page with waitlist |
| `/login` | Password + magic link auth |
| `/signup` | Account creation |
| `/onboarding` | 6-step OnboardingWizard |
| `/onboarding/setup` | SetupWizard (alternative 3-step flow) |
| `/select-plan` | Stripe plan selection |
| `/reset-password` | Password reset |
| `/demo` | Demo mode entry |
| `/auth/expired` | Expired link error page |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

### Admin Dashboard (22 routes) — All Implemented

| Route | Implementation |
|-------|---------------|
| `/admin` | Full dashboard: KPI cards, pie chart, funnel, AI insights |
| `/admin/leads` | Advanced table with filters, sorting, pagination, CSV import |
| `/admin/leads/[id]` | Full lead detail (503 lines): AI scoring, editable fields, conversations |
| `/admin/leads-new` | Pipeline overview with priority actions, grid toggle (243 lines) |
| `/admin/leads-new/[id]` | Delegates to LeadDetail component |
| `/admin/campaigns` | Campaign management with inline editing |
| `/admin/campaigns/[id]` | Campaign detail view |
| `/admin/analytics` | Quality breakdown, funnel, source/dev performance |
| `/admin/users` | User management with invites, approve/reject, search, filters |
| `/admin/users/[id]` | Full user profile with inline editing (650 lines) |
| `/admin/companies` | Company grid with CRUD, search, status filters (575 lines) |
| `/admin/companies/[id]` | Company detail page |
| `/admin/developments` | Development management |
| `/admin/developments/[id]` | Development detail |
| `/admin/borrowers` | Borrower management |
| `/admin/borrowers/[id]` | Borrower detail |
| `/admin/ai-analysis` | Full AI pipeline analysis (427 lines) |
| `/admin/billing` | MRR/ARR dashboard, tier breakdown, subscriber list (471 lines) |
| `/admin/conversations` | Conversations with buyer/borrower tabs, company filter |
| `/admin/settings` | Delegates to SettingsPage component |
| `/admin/settings/api-keys` | Delegates to ApiKeysSettingsPage component |
| `/admin/settings/billing` | Delegates to BillingPanel component |

### Agent Dashboard (13 routes) — All Implemented

| Route | Implementation |
|-------|---------------|
| `/agent` | Delegates to DashboardPage (shared) |
| `/agent/insights` | Company-filtered AI insights |
| `/agent/pipeline` | Delegates to PipelineBoard with userType="agent" |
| `/agent/outcomes` | Delegates to OutcomeSummary with userType="agent" |
| `/agent/campaigns` | Full campaign list with company filtering (112 lines) |
| `/agent/buyers` | Delegates to BuyerCardGrid component |
| `/agent/matches` | Full matches display (105 lines) |
| `/agent/conversations` | Delegates to ConversationsView |
| `/agent/my-leads` | Full leads table with actions (324 lines) |
| `/agent/my-leads/[id]` | Delegates to LeadDetail component |
| `/agent/developments` | Full development grid with search/filters (311 lines) |
| `/agent/settings` | Delegates to SettingsPage |
| `/agent/settings/billing` | Delegates to BillingPanel |

### Developer Dashboard (16 routes) — All Implemented

| Route | Implementation |
|-------|---------------|
| `/developer` | Delegates to DashboardPage (shared) |
| `/developer/insights` | Company-filtered AI insights |
| `/developer/buyers` | LeadManagementPage in property mode |
| `/developer/buyers/[id]` | Full lead detail with NB Score ring (635 lines) |
| `/developer/buyers/import` | Complete CSV import wizard (830 lines) |
| `/developer/buyers/new` | Delegates to AddBuyerForm |
| `/developer/leads` | Redirect to /developer/buyers |
| `/developer/pipeline` | Full pipeline with development filter (68 lines) |
| `/developer/outcomes` | Delegates to OutcomeSummary |
| `/developer/campaigns` | Full campaign management (153 lines) |
| `/developer/conversations` | Delegates to ConversationsView |
| `/developer/developments` | Full development grid (317 lines) |
| `/developer/matches` | Full matches display with demo data (255 lines) |
| `/developer/settings` | Delegates to SettingsPage |
| `/developer/settings/api-keys` | Delegates to ApiKeysSettingsPage |
| `/developer/settings/billing` | Delegates to BillingPanel |

### Broker Dashboard (12 routes) — All Implemented

| Route | Implementation |
|-------|---------------|
| `/broker` | Delegates to DashboardPage (shared) |
| `/broker/borrowers` | Delegates to LeadManagementPage (finance mode) |
| `/broker/borrowers/[id]` | Full borrower detail with inline editing (701 lines) |
| `/broker/buyers` | Delegates to BuyerCardGrid |
| `/broker/campaigns` | Campaign list with company filtering (87 lines) |
| `/broker/conversations` | Delegates to ConversationsView |
| `/broker/insights` | Full insights with metrics (259 lines) |
| `/broker/matches` | Full matches display (160 lines) |
| `/broker/outcomes` | Delegates to OutcomeSummary |
| `/broker/pipeline` | Delegates to PipelineBoard |
| `/broker/settings` | Delegates to SettingsPage |
| `/broker/settings/billing` | Delegates to BillingPanel |

### Summary: ~74 routes total. ALL have implementations (full or shared component delegate).

---

## 3. Supabase Connection — Solid

### Client Setup

| File | Type | Notes |
|------|------|-------|
| `lib/supabase/client.ts` | Browser | `@supabase/ssr`, **PKCE flow** (migrated from implicit) |
| `lib/supabase/server.ts` | Server + Admin | Cookie-based sessions, **PKCE flow** |
| `lib/supabase/middleware.ts` | Middleware | Session refresh via `getUser()`, **PKCE flow** |

### Auth Callback

`app/auth/callback/route.ts` — Handles PKCE code exchange, OTP verification, internal team routing, onboarding redirect, and role-based dashboard routing.

---

## 4. Onboarding Flow

### Current Implementation

Two parallel onboarding flows exist:
1. **Main Wizard** (`/onboarding`) — 6-step OnboardingWizard using `user_profiles.onboarding_step`
2. **Setup Wizard** (`/onboarding/setup`) — 3-step simplified flow using `onboarding_progress` table

The `onboarding_progress` table is NOT dead code — it's used by the alternative setup flow.

### Fixes Applied

- **T&C acceptance checkbox** added to WelcomeStep (Step 1) with links to /terms and /privacy
- **Admin approval flow** added for users who join existing companies with `pending_approval` status
- **Dual-flow documented** in `useOnboardingProgress.ts` to prevent confusion

### Remaining Gaps (by design, not bugs)

1. No email verification step in wizard (handled by Supabase auth email confirmation)
2. No KYC/AML in onboarding (separate feature, `kyc_checks` table exists)
3. No billing step (trial starts automatically, card collection deferred)
4. No document upload in onboarding (available in development detail pages)
5. No avatar upload in onboarding (available in settings)

---

## 5. Dashboard Components — Comprehensive

### Dashboard Widgets (14 complete)

ScoreBadge, LeadCard, ClassificationPill, RiskFlagBadge, AgentStats, HotLeadsWidget, PriorityActions, PipelineOverview, DevelopmentCard, MorningPriority, DevelopmentPerformance, PipelineBoard, NextActionButton, NotificationBell

### Shared Page Components (4)

- `DashboardPage` — Shared dashboard homepage for all roles
- `SettingsPage` — Shared settings page for all roles
- `BuyerCardGrid` — Shared buyer card grid for agents/brokers
- `LeadManagementPage` — Shared lead management for all roles

### Specialised Components

- `ApiKeysSettingsPage` + `ApiKeysManager` — API key CRUD
- `BillingPanel` + `PlanCard` — Billing management
- `ConversationsView` — Conversation/messaging interface
- `OutcomeSummary` — Outcome tracking for all roles

### Base UI Components (25+)

Full shadcn/ui library with custom variants for the Giga design system.

---

## 6. Issues Found & Fixed

| # | Issue | Status | Fix Applied |
|---|-------|--------|-------------|
| A2 | `onboarding_progress` table appeared unused | **Clarified** | Documented dual-flow in useOnboardingProgress.ts — NOT dead code |
| A3 | No T&C acceptance in onboarding | **Fixed** | Added checkbox with links to /terms and /privacy in WelcomeStep |
| A4 | No admin approval flow for pending members | **Fixed** | Added approve/reject buttons + pending banner in admin users page |
| A8 | Implicit auth flow deprecated by Supabase | **Fixed** | Migrated all 3 Supabase clients to PKCE flow |

### Issues NOT Actually Present (Corrected from initial audit)

| Initial Claim | Reality |
|---------------|---------|
| ~55 skeleton routes | All routes have implementations (full or shared delegates) |
| A1: Admin skeleton pages need fleshing out | All admin pages are full implementations |
| A5: Developer dashboard incomplete | All developer pages are implemented |
| A6: Agent dashboard incomplete | All agent pages are implemented |
| B1: Broker dashboard needs building | All broker pages are implemented |
| B2: Conversation system needs building | ConversationsView component exists and is used |
| B3: Property-buyer matching needs building | Matches pages exist for all roles |
| B4: Billing management needs building | BillingPanel + admin billing page exist |
| B5: API key management needs building | ApiKeysSettingsPage exists |
| B6: Settings pages need building | SettingsPage shared component exists |
| B7: Campaign detail needs building | Campaign pages exist for all roles |
| B8: Development detail needs building | Development pages exist for all roles |
| B9: Outcome tracking needs building | OutcomeSummary component exists |
| B10: Admin AI analysis needs building | Full AI analysis page exists (427 lines) |

### Remaining Genuine Gaps

1. **Zero automated tests** — No test files in the codebase
2. **No onboarding analytics** — No drop-off tracking or conversion metrics
3. **No post-onboarding checklist** — No guided first-use experience after signup

---

## 7. Files Modified in This PR

| File | Change |
|------|--------|
| `components/onboarding/steps/WelcomeStep.tsx` | Added T&C acceptance checkbox |
| `lib/supabase/client.ts` | Migrated from implicit to PKCE flow |
| `lib/supabase/server.ts` | Migrated from implicit to PKCE flow |
| `lib/supabase/middleware.ts` | Migrated from implicit to PKCE flow |
| `app/admin/users/page.tsx` | Added approve/reject flow for pending members |
| `hooks/useOnboardingProgress.ts` | Documented dual onboarding flow |
| `docs/AUDIT_REPORT.md` | Corrected initial audit inaccuracies |
