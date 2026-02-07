# Naybourhood Refactoring Plan
## A Step-by-Step Guide to Clean Up the Codebase

**For:** Development Team
**Goal:** Reduce codebase from 50,000 → 18,000 lines, zero warnings, better performance

---

## Overview

We're going to do this in 6 parts. Each part is independent — you can ship after each one. No big bang rewrites.

```
Part 1: Quick Wins              → Fix warnings, delete dead code
Part 2: Consolidate Pages       → Merge duplicate pages
Part 3: Break Up Giants         → Split large components  
Part 4: Fix Data Layer          → Stop loading everything
Part 5: Shared Components       → Build reusable library
Part 6: Final Cleanup           → Polish and optimize
```

**Lines of code reduction target per part:**
- Part 1: -3,000 lines
- Part 2: -8,000 lines
- Part 3: -5,000 lines
- Part 4: -2,000 lines
- Part 5: -4,000 lines
- Part 6: -2,000 lines

---

# PART 1: Quick Wins

### Task 1.1: Fix All React Hook Warnings

**Why:** These are actual bugs that cause unpredictable behavior.

**Files to fix:**

#### File 1: `app/admin/borrowers/page.tsx` (Line 412)
```typescript
// BEFORE (broken):
const paginatedBorrowers = useMemo(() => {
  const start = (currentPage - 1) * pageSize
  return filteredBorrowers.slice(start, start + pageSize)
}, [filteredBorrowers, pageSize])  // ❌ Missing currentPage

// AFTER (fixed):
const paginatedBorrowers = useMemo(() => {
  const start = (currentPage - 1) * pageSize
  return filteredBorrowers.slice(start, start + pageSize)
}, [filteredBorrowers, pageSize, currentPage])  // ✅ Added currentPage
```

#### File 2: `app/admin/companies/page.tsx` (Line 72)
```typescript
// Find the useMemo and add 'computeStart' to dependencies
// Or better: inline the computation if it's simple
```

#### File 3: `app/admin/leads/[id]/page.tsx` (Line 683)
```typescript
// BEFORE (broken):
useEffect(() => {
  if (shouldAutoScore) {
    setTimeout(() => {
      handleRescore()  // ❌ Used but not in deps
    }, 500)
  }
}, [lead, hasAutoScored, isRescoring, scoreResult])

// AFTER (fixed):
const handleRescore = useCallback(async () => {
  // ... existing code
}, [lead?.id, updateLead])

useEffect(() => {
  if (shouldAutoScore) {
    setTimeout(() => {
      handleRescore()
    }, 500)
  }
}, [lead, hasAutoScored, isRescoring, scoreResult, handleRescore])
```

#### File 4: `app/login/page.tsx` (Line 99)
```typescript
// BEFORE:
useEffect(() => {
  // ... code that calls redirectBasedOnRole
}, [router, supabaseConfigured])

// AFTER:
const redirectBasedOnRole = useCallback((role: string) => {
  switch (role) {
    case 'admin': router.push('/admin'); break
    case 'agent': router.push('/agent'); break
    case 'broker': router.push('/broker'); break
    default: router.push('/developer')
  }
}, [router])

useEffect(() => {
  // ... code
}, [router, supabaseConfigured, redirectBasedOnRole])
```

#### File 5: `components/ConversationThread.tsx` (Lines 150, 410)
```typescript
// Wrap fetchConversations in useCallback and add to both useEffect deps
const fetchConversations = useCallback(async () => {
  // ... existing fetch logic
}, [supabase, userId])  // Add actual dependencies
```

### Task 1.2: Delete Dead Code

**Files to delete entirely:**
- `app/dashboard/page.tsx` — Orphan page, not reachable from any route
- Any `.bak`, `.old`, or commented-out component files
- Unused imports in every file (run `npx eslint --fix`)

**Run this to find more dead code:**
```bash
npx ts-prune | grep -v "used in module"
```

### Task 1.3: Fix Build Warnings

```bash
npm run build 2>&1 | grep "warning"
```

Fix every warning. Most will be unused variables and missing dependencies.

---

# PART 2: Consolidate Pages

### Task 2.1: Merge Settings Pages

**Current state:** 4 nearly identical settings pages:
- `app/admin/settings/page.tsx`
- `app/developer/settings/page.tsx`
- `app/agent/settings/page.tsx`
- `app/broker/settings/page.tsx`

**Target:** 1 shared component, 4 thin wrappers.

```typescript
// components/shared/SettingsPage.tsx
interface SettingsPageProps {
  userType: 'admin' | 'developer' | 'agent' | 'broker'
  availableTabs: string[]
}

export function SettingsPage({ userType, availableTabs }: SettingsPageProps) {
  // ALL settings logic lives here
  // Tabs shown based on availableTabs prop
}
```

```typescript
// app/developer/settings/page.tsx (entire file - 5 lines)
import { SettingsPage } from '@/components/shared/SettingsPage'

export default function DeveloperSettings() {
  return <SettingsPage userType="developer" availableTabs={['profile', 'notifications', 'billing']} />
}
```

**Savings: ~2,100 lines**

### Task 2.2: Merge Dashboard Pages

**Current state:** 3 near-identical dashboards:
- `app/developer/dashboard/page.tsx`
- `app/agent/dashboard/page.tsx`
- `app/broker/dashboard/page.tsx`

**Same approach:** Create `components/shared/DashboardPage.tsx` that accepts `userType` and renders the correct stats/widgets.

### Task 2.3: Merge Lead List Pages

**Current state:** Multiple lead/borrower list views with duplicated table, filter, and pagination logic.

**Target:** One `LeadsTable` component used everywhere.

```typescript
// components/shared/LeadsTable.tsx
interface LeadsTableProps {
  userType: 'admin' | 'developer' | 'agent' | 'broker'
  filters?: FilterConfig
  columns?: ColumnConfig[]
  onRowClick?: (lead: Lead) => void
}
```

**Savings: ~5,000-8,000 lines**

---

# PART 3: Break Up Giants

### Task 3.1: Split Lead Detail Page

**Current:** `app/admin/leads/[id]/page.tsx` — 1,468 lines

**Target structure:**
```
components/leads/detail/
  LeadDetailPage.tsx         (100 lines - layout only)
  LeadHeader.tsx             (80 lines)
  LeadContactCard.tsx        (60 lines)
  LeadScoreCard.tsx          (120 lines)
  LeadScoreBreakdown.tsx     (100 lines)
  LeadStatusSelector.tsx     (50 lines)
  LeadActivityTimeline.tsx   (80 lines)
  LeadNotesSection.tsx       (60 lines)
  LeadEmailSection.tsx       (40 lines)
  LeadConversations.tsx      (40 lines)
  
hooks/
  useLeadDetail.ts           (60 lines - data fetching & mutations)
  
lib/
  leadUtils.ts               (80 lines - parseBudgetRange, formatDate, etc.)
```

**Step-by-step:**

1. Extract utility functions (parseBudgetRange, formatDate, etc.) → `lib/leadUtils.ts`
2. Extract score card → `LeadScoreCard.tsx`
3. Extract header → `LeadHeader.tsx`
4. Extract contact info → `LeadContactCard.tsx`
5. Create data hook → `useLeadDetail.ts`
6. Wire up the layout page that composes all sub-components

### Task 3.2: Split CampaignWizard

**Current:** `components/CampaignWizard.tsx` — 1,152 lines

**Target structure:**
```
components/campaigns/wizard/
  CampaignWizard.tsx         (80 lines - stepper/layout)
  StepBasicInfo.tsx           (100 lines)
  StepAudience.tsx            (120 lines)
  StepCreative.tsx            (150 lines)
  StepBudget.tsx              (80 lines)
  StepReview.tsx              (100 lines)
  
hooks/
  useCampaignWizard.ts       (80 lines - state machine)
```

### Task 3.3: Split CampaignsList

**Current:** `components/CampaignsList.tsx` — 974 lines

Same pattern: extract table, filters, stats cards into separate components.

---

# PART 4: Fix Data Layer

### Task 4.1: Replace DataContext with React Query

**Current problem:** `DataContext.tsx` (1,284 lines) loads ALL data for ALL entities on mount. Every page load fetches everything.

**Install React Query:**
```bash
npm install @tanstack/react-query
```

**Create focused hooks:**

```typescript
// hooks/useLeads.ts
import { useQuery, useMutation } from '@tanstack/react-query'

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => fetchLeads(filters),
    staleTime: 30_000, // Cache for 30 seconds
  })
}

export function useUpdateLead() {
  return useMutation({
    mutationFn: (data: UpdateLeadInput) => updateLead(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  })
}
```

```typescript
// hooks/useCompanies.ts
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  })
}
```

**Then in pages:**
```typescript
// BEFORE: Every page loads everything
const { leads, companies, campaigns, users, ... } = useData()

// AFTER: Each page loads only what it needs
const { data: leads, isLoading } = useLeads({ status: 'active' })
```

**Impact:** Pages load 50KB instead of 2MB. Background refresh. Built-in error handling.

### Task 4.2: Remove DataContext

Once all pages use React Query hooks, delete `DataContext.tsx` entirely.

---

# PART 5: Shared Components

### Task 5.1: Create Component Library

```
components/ui/
  DataTable.tsx              → Reusable table with sorting, filtering, pagination
  StatusBadge.tsx            → Consistent status display
  ScoreIndicator.tsx         → Score circle/bar used across pages
  PageHeader.tsx             → Consistent page headers
  EmptyState.tsx             → "No data" displays
  LoadingState.tsx           → Skeleton loaders
  FilterBar.tsx              → Reusable filter controls
  ConfirmDialog.tsx          → Consistent confirmation modals
```

### Task 5.2: Install and Configure shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input select table tabs
```

Replace custom implementations with shadcn/ui components for consistency.

---

# PART 6: Final Cleanup

### Task 6.1: Consistent File Structure

**Target:**
```
app/
  admin/           → Admin-specific pages (thin wrappers)
  developer/       → Developer-specific pages (thin wrappers)
  agent/           → Agent-specific pages (thin wrappers)
  broker/          → Broker-specific pages (thin wrappers)
  api/             → API routes

components/
  shared/          → Full-page components used across roles
  leads/           → Lead-related sub-components
  campaigns/       → Campaign-related sub-components
  ui/              → Design system / reusable primitives

hooks/             → React Query hooks + custom hooks
lib/               → Utilities, API clients, constants
types/             → TypeScript type definitions
```

### Task 6.2: Run Final Checks

```bash
# Zero warnings
npm run build 2>&1 | grep "warning" | wc -l  # Should be 0

# No unused exports
npx ts-prune

# No circular dependencies
npx madge --circular --extensions ts,tsx .

# Bundle size check
npx next build && npx @next/bundle-analyzer
```

---

## Target End State

| Metric | Before | After |
|--------|--------|-------|
| Lines of code | ~50,000 | ~18,000 |
| Build warnings | 12+ | 0 |
| Largest component | 1,468 lines | <200 lines |
| Initial page load | ~2MB | ~50KB |
| Duplicated code | ~60% | <5% |
| Data fetching | Everything on mount | On-demand per page |

---

## Rules While Refactoring

1. **Ship after every part** — don't batch changes
2. **No new features during refactor** — only restructure
3. **Run tests after every file change** — `npm run build` must pass
4. **Commit often** — one commit per task
5. **If unsure, ask** — don't guess on business logic

---

Questions? Ping Kofi and he'll clarify.
