# Manual QA Test Checklist

## Authentication & Login Flow

### Login Page (`/login`)
- [ ] Password login: Enter email + password, click "Sign In" -> redirects to correct dashboard immediately (no refresh needed)
- [ ] Magic link login: Enter email, click "Send Magic Link" -> confirmation shown
- [ ] Magic link callback: Click magic link in email -> redirects to correct dashboard
- [ ] Already logged in: Navigate to `/login` while authenticated -> auto-redirects to dashboard
- [ ] Invalid credentials: Enter wrong password -> error message shown inline
- [ ] Session persistence: Refresh browser after login -> stays logged in (no re-login required)

### Auth State
- [ ] Company association: After login, verify `user.company_id` is populated from database (not stale localStorage)
- [ ] Role assignment: User role (developer/agent/broker/admin) correctly determines dashboard redirect
- [ ] Logout: Click logout -> redirects to `/login`, clears session, cannot access protected routes

---

## Developer Dashboard (`/developer`)

### Dashboard Page
- [ ] Stats load with real data (not showing 0 when data exists)
- [ ] Recent leads table populated
- [ ] Top campaigns section shows data
- [ ] Onboarding prompt shows for new accounts

### Buyers Page (`/developer/buyers`)
- [ ] Lead table loads with leads filtered by company
- [ ] Search: Type in search box -> filters by name/email/phone in real time
- [ ] Status filter: Select a status -> only matching leads shown
- [ ] Classification filter: Select a classification -> only matching leads shown
- [ ] Sort: Click sort options (score/newest/oldest) -> leads reorder
- [ ] Row click: Click a lead row -> navigates to `/developer/buyers/[id]`
- [ ] Status change: Click status badge on a lead -> dropdown appears, select new status -> saves
- [ ] Quick actions: Call/Email/WhatsApp buttons on each lead -> open correct app/protocol
- [ ] Archive: Use quick action to archive a lead -> lead moves to archived
- [ ] Mark duplicate: Use quick action to mark duplicate -> lead marked
- [ ] Show archived toggle: Enable -> archived/duplicate/fake leads appear
- [ ] Empty state: Shows appropriate message when no leads exist

### Buyer Detail Page (`/developer/buyers/[id]`)
- [ ] Lead details load correctly (name, email, phone, scores, timeline)
- [ ] Status dropdown: Change status -> saves to database
- [ ] Notes: Add a note -> note appears in timeline
- [ ] Rescore: Click rescore button -> scores update
- [ ] Contact buttons: Call/Email/WhatsApp -> open correct protocol
- [ ] Back navigation: Back button returns to buyers list

### Campaigns Page (`/developer/campaigns`)
- [ ] Campaigns load (not showing 0 when campaigns exist)
- [ ] Campaigns filtered by company (API handles filtering, client shows all API results when company_id not yet loaded)
- [ ] Search: Filter campaigns by name
- [ ] New Campaign button: Opens create modal
- [ ] Create campaign: Fill form, submit -> campaign created

### Developments Page (`/developer/developments`)
- [ ] Developments load filtered by company
- [ ] Search: Filter by name/location/developer
- [ ] Status filter buttons: All/Active/Coming Soon/Sold Out work
- [ ] Development card click: Navigate to detail view
- [ ] Refresh button: Reloads developments data
- [ ] Add Development: Opens create modal -> form submission works

### Conversations Page (`/developer/conversations`)
- [ ] Conversations load (not showing "No company linked" during auth loading)
- [ ] Search: Filter by name/email/phone/message
- [ ] Channel filter: All/Call/WhatsApp/Email
- [ ] Status filter dropdown
- [ ] Quick stat cards: Click to filter by category
- [ ] Conversation card click: Opens slide panel with details
- [ ] Call/WhatsApp/Email quick actions in panel
- [ ] "View Full Lead Profile" button in panel -> navigates to buyer detail

### Settings Page (`/developer/settings`)
- [ ] Profile section: Edit name, phone, role -> Save -> persists
- [ ] Company info: Shows current company details
- [ ] Team section: Invite form with email input -> sends invite
- [ ] Members list: Shows current team members

---

## Agent Dashboard (`/agent`)

### Dashboard Page
- [ ] Stats load correctly
- [ ] Recent leads populated

### Buyers Page (`/agent/buyers`)
- [ ] Buyer card grid loads with leads filtered by company
- [ ] Does NOT show "No company linked" while auth is loading
- [ ] Search: Filter by name/email/phone
- [ ] Status filter: Dropdown filters cards
- [ ] Phone button: Opens phone dialer
- [ ] Email button: Opens email client
- [ ] View button: Opens detail view
- [ ] Favorite (heart) button: Toggles favorite
- [ ] LeadIntakeForm: "Add Lead" button opens form

### Campaigns Page (`/agent/campaigns`)
- [ ] Campaigns load (company filter applied server-side, shown when company_id loads)
- [ ] Search works
- [ ] Campaign creation works

### Conversations Page (`/agent/conversations`)
- [ ] Loads without "No company linked" flash during auth init
- [ ] All ConversationsView features work (search, filter, quick actions, slide panel)

---

## Broker Dashboard (`/broker`)

### Dashboard Page
- [ ] Broker-specific stats load (borrower stats)
- [ ] Recent borrowers list populated

### Borrowers Page (`/broker/borrowers`)
- [ ] Borrower table loads with data filtered by company
- [ ] Search/filter/sort work
- [ ] Row click -> navigates to borrower detail
- [ ] Status changes save

### Borrower Detail Page (`/broker/borrowers/[id]`)
- [ ] Borrower details load
- [ ] Status changes save
- [ ] Notes work
- [ ] Contact actions work

### Campaigns Page (`/broker/campaigns`)
- [ ] Uses AuthContext (not localStorage) for company_id
- [ ] Campaigns load and filter correctly
- [ ] Search works
- [ ] Campaign creation works

### Conversations Page (`/broker/conversations`)
- [ ] Uses AuthContext (not localStorage) for company_id
- [ ] Loads without flash of "no company" message
- [ ] All ConversationsView features work

### Insights Page (`/broker/insights`)
- [ ] Data loads correctly for company

---

## Admin Dashboard (`/admin`)

### Dashboard Page
- [ ] Admin sees all-company stats (not filtered by single company)
- [ ] Stats show real data (not 0)

### Leads Page (`/admin/leads`)
- [ ] All leads visible across companies
- [ ] Inline editing: Double-click any cell -> edit -> saves
- [ ] Column visibility toggle
- [ ] Advanced filters: Status, classification, company, date range
- [ ] Search: Filter by name/email/phone
- [ ] Sort: Click column headers
- [ ] Pagination: Next/prev/page size controls
- [ ] Bulk selection: Checkbox selects rows
- [ ] Row click: Opens lead detail
- [ ] Status badge click: Dropdown to change status

### Campaigns Page (`/admin/campaigns`)
- [ ] All campaigns visible (admin bypass - no company filter)
- [ ] Grouped by development name
- [ ] Group expand/collapse
- [ ] Search campaigns
- [ ] Inline spend editing (EditableCell - double-click)
- [ ] Campaign row click -> navigates to detail
- [ ] Create Campaign modal: All fields work
- [ ] AI Overview and Campaign Insights render
- [ ] Lead counts from buyers table match correctly

### Developments Page (`/admin/developments`)
- [ ] All developments visible across companies
- [ ] No debug console.log output in browser console
- [ ] Search by name/location/developer
- [ ] Status filter buttons
- [ ] Development card click -> navigates to detail
- [ ] Refresh button
- [ ] Create Development modal: All fields including company selector
- [ ] Unit stats calculate correctly (total/available/sold)

### Conversations Page (`/admin/conversations`)
- [ ] Tabs: Buyers / Borrowers toggle
- [ ] Company filter dropdown
- [ ] All ConversationsView features work in both tabs

---

## Cross-Cutting Concerns

### Data Loading
- [ ] No pages show 0/empty when data exists in the database
- [ ] Loading spinners/states shown while data fetches
- [ ] Error states shown on API failures (not silent empty)
- [ ] Session check: All hooks verify auth session before querying Supabase

### Auth Guards
- [ ] Unauthenticated users redirected to `/login` from all protected routes
- [ ] Role-based access: Developer can't access `/admin`, etc.
- [ ] Admin/internal team users bypass company_id requirement in API routes

### API Routes
- [ ] `GET /api/leads` - Returns leads, admin sees all, others filtered by company
- [ ] `GET /api/campaigns` - Returns campaigns, admin bypass works
- [ ] `GET /api/dashboard/stats` - Returns stats, admin bypass works
- [ ] All API routes return proper error codes (401 for unauth, 403 for no company)

### Company Association
- [ ] company_id always sourced from database (AuthContext), not stale localStorage
- [ ] Pages using AuthContext.user.company_id correctly filter data
- [ ] Pages show loading state while AuthContext initializes (not "No company linked" flash)

---

## Changes Made (Summary)

### Phase A: Auth/Login Flow
1. `app/login/page.tsx` - Added `router.refresh()` after sign-in to trigger server component re-render
2. `contexts/AuthContext.tsx` - Removed stale localStorage fallback for company_id; added `router.refresh()` to auth state change handlers

### Phase B: Data Loading
3. `hooks/useLeads.ts` - Added session check before Supabase query
4. `hooks/useDevelopments.ts` - Added session check before Supabase query
5. `hooks/useFinanceLeads.ts` - Added session check before Supabase query
6. `hooks/useCompanies.ts` - Added session check before Supabase query
7. `hooks/useUsers.ts` - Added session check before Supabase query
8. `app/api/campaigns/route.ts` - Admin/internal team bypass for company_id filter
9. `app/api/dashboard/stats/route.ts` - Admin/internal team bypass for company_id gate

### Phase C: Interactive Elements & Pages
10. `app/developer/campaigns/page.tsx` - Fixed client-side double-filter showing empty
11. `app/agent/campaigns/page.tsx` - Same fix
12. `app/broker/campaigns/page.tsx` - Replaced localStorage pattern with AuthContext
13. `app/developer/developments/page.tsx` - Replaced localStorage with AuthContext
14. `app/broker/conversations/page.tsx` - Replaced localStorage pattern with AuthContext
15. `app/developer/conversations/page.tsx` - Added auth loading check, fixed company filter
16. `app/agent/conversations/page.tsx` - Added auth loading check, fixed company filter
17. `components/shared/BuyerCardGrid.tsx` - Added auth loading check to prevent "No company linked" flash
18. `components/shared/LeadManagementPage.tsx` - Replaced localStorage pattern with AuthContext for finance mode
19. `app/admin/developments/page.tsx` - Removed debug console.logs
