# NAYBOURHOOD INTEGRATION CHECKLIST

**Last Updated:** 2026-01-08
**Total Pending Integrations:** 47

---

## PRIORITY LEGEND

| Priority | Description | SLA |
|----------|-------------|-----|
| P0 | Critical - Breaks core functionality | Immediate |
| P1 | High - Key user workflows affected | This sprint |
| P2 | Medium - Feature incomplete | Next sprint |
| P3 | Low - Nice to have | Backlog |

---

## P0 - CRITICAL (4 items)

### 1. Stripe Webhook - Subscription Updates
**File:** `/app/api/stripe/webhook/route.ts`
**Lines:** 36, 46, 53, 66
**Complexity:** Medium
**Dependencies:** Supabase profiles/companies table, Stripe customer metadata

**What's Needed:**
```
- checkout.session.completed → Update user subscription status + tier
- customer.subscription.created/updated → Sync subscription tier to DB
- customer.subscription.deleted → Downgrade user, revoke access
- invoice.payment_failed → Notify user, flag account
```

**Why P0:** Without this, paid users won't have their subscriptions reflected in the app. They pay but don't get access.

---

### 2. Stripe Webhook - Payment Failure Notification
**File:** `/app/api/stripe/webhook/route.ts`
**Line:** 66
**Complexity:** Simple
**Dependencies:** Email API, user profiles

**What's Needed:**
- Send email notification on `invoice.payment_failed`
- Update user status to `past_due` in database

**Why P0:** Users won't know their payment failed, leading to service interruption without warning.

---

### 3. Admin Leads - Bulk Assign Action
**File:** `/app/admin/leads-new/page.tsx`
**Line:** 82
**Complexity:** Medium
**Dependencies:** User list API, bulkUpdateLeads function

**What's Needed:**
- Modal with user/agent dropdown
- Call bulkUpdateLeads with selected user IDs
- Toast confirmation

**Why P0:** Core admin workflow - assigning leads to team members is essential.

---

### 4. Admin Leads - Bulk Status Change
**File:** `/app/admin/leads-new/page.tsx`
**Line:** 85
**Complexity:** Simple
**Dependencies:** Status list, bulkUpdateLeads function

**What's Needed:**
- Modal with status dropdown
- Call bulkUpdateLeads with new status
- Toast confirmation

**Why P0:** Core admin workflow - moving leads through pipeline in bulk.

---

## P1 - HIGH PRIORITY (12 items)

### 5. Admin Leads - Export to CSV
**File:** `/app/admin/leads-new/page.tsx`
**Line:** 88
**Complexity:** Medium
**Dependencies:** None (client-side)

**What's Needed:**
- Generate CSV from selected leads
- Trigger browser download
- Include key fields (name, email, phone, status, score)

---

### 6. Admin Leads - Quick Actions Handler
**File:** `/app/admin/leads-new/page.tsx`
**Line:** 123
**Complexity:** Simple
**Dependencies:** Existing action handlers

**What's Needed:**
- Route quick actions (call, email, whatsapp) to existing handlers
- Add navigation to lead detail option

---

### 7. Admin Finance Leads - Phone Button
**File:** `/app/admin/finance-leads/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Add `window.open('tel:${lead.phone}')` to onClick handler

---

### 8. Admin Finance Leads - Email Button
**File:** `/app/admin/finance-leads/page.tsx`
**Complexity:** Simple
**Dependencies:** EmailComposer component

**What's Needed:**
- Add state for email modal
- Open EmailComposer on click

---

### 9. Admin Finance Leads - Export Button
**File:** `/app/admin/finance-leads/page.tsx`
**Complexity:** Medium
**Dependencies:** None (client-side)

**What's Needed:**
- Generate CSV from filtered finance leads
- Trigger browser download

---

### 10. Settings - Notification Preferences (All Portals)
**Files:**
- `/app/agent/settings/page.tsx`
- `/app/developer/settings/page.tsx`
- `/app/broker/settings/page.tsx`
**Complexity:** Medium
**Dependencies:** New database column or preferences table

**What's Needed:**
- Add notification_preferences JSON column to profiles table
- Toggle buttons update preferences via API
- Load current preferences on mount
- 5 toggles × 3 portals = 15 buttons

---

### 11. Agent Buyers - View Details Button
**File:** `/app/agent/buyers/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Add `router.push('/agent/my-leads/${lead.id}')` to Eye button onClick

---

### 12. Agent Buyers - Favorite Button
**File:** `/app/agent/buyers/page.tsx`
**Complexity:** Medium
**Dependencies:** New favorites table or column

**What's Needed:**
- Add is_favorite column to buyers table OR favorites junction table
- Toggle favorite status on click
- Show filled heart when favorited

---

### 13. Agent Conversations - Search Input
**File:** `/app/agent/conversations/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Add onChange handler to filter conversations by search term
- Filter by lead name, message content

---

### 14. Agent Conversations - Card Click
**File:** `/app/agent/conversations/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Add onClick to navigate to conversation detail or lead detail

---

### 15. Developer/Broker Conversations - Same as Agent
**Files:**
- `/app/developer/conversations/page.tsx`
- `/app/broker/conversations/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Same fixes as Agent conversations (search + card click + phone)

---

### 16. LeadDetail - Archive Button
**File:** `/components/leads/LeadDetail.tsx`
**Complexity:** Simple
**Dependencies:** updateLead function

**What's Needed:**
- Add onClick handler to set status to "Not Proceeding" or "Archived"
- Add confirmation dialog

---

## P2 - MEDIUM PRIORITY (18 items)

### 17. Admin Dashboard - Upload Button
**File:** `/app/admin/page.tsx`
**Complexity:** Medium
**Dependencies:** File upload API, storage

**What's Needed:**
- File input or drag-drop zone
- Upload to Supabase storage or process CSV
- Connect to existing import functionality

---

### 18. Admin Leads - Add Lead Button
**File:** `/app/admin/leads-new/page.tsx`
**Complexity:** Medium
**Dependencies:** Create lead API

**What's Needed:**
- Modal with lead form fields
- POST to /api/leads
- Refresh list on success

---

### 19. Admin Campaigns - Filter Button
**File:** `/app/admin/campaigns/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Filter modal with platform, status, date range options
- Apply filters to campaign list

---

### 20. Admin Analytics - Export Report
**File:** `/app/admin/analytics/page.tsx`
**Complexity:** Medium
**Dependencies:** PDF/CSV generation library

**What's Needed:**
- Generate report from analytics data
- PDF or CSV format
- Download trigger

---

### 21. Admin Billing - Company Row Click
**File:** `/app/admin/billing/page.tsx`
**Complexity:** Simple
**Dependencies:** None

**What's Needed:**
- Add onClick to navigate to company detail page

---

### 22. Admin Billing - Stripe Dashboard Button
**File:** `/app/admin/billing/page.tsx`
**Complexity:** Simple
**Dependencies:** Stripe dashboard URL

**What's Needed:**
- Link to Stripe dashboard (external URL)
- Or open billing portal for specific company

---

### 23. Admin Billing - Export Report
**File:** `/app/admin/billing/page.tsx`
**Complexity:** Medium
**Dependencies:** CSV generation

**What's Needed:**
- Export billing/subscription data to CSV
- Include MRR, subscription dates, status

---

### 24-26. Matches Pages - All Action Buttons
**Files:**
- `/app/agent/matches/page.tsx`
- `/app/developer/matches/page.tsx`
- `/app/broker/matches/page.tsx`
**Complexity:** Simple each
**Dependencies:** Existing modals/navigation

**What's Needed:**
- Contact button → Open communication modal or tel: link
- Email button → Open EmailComposer
- Eye button → Navigate to match/lead detail

---

### 27-29. Dashboard Priority Lead Buttons
**Files:**
- `/app/developer/page.tsx`
- `/app/broker/page.tsx`
**Complexity:** Simple each
**Dependencies:** None

**What's Needed:**
- Phone button → tel: protocol
- Eye button → Navigate to lead detail

---

### 30. Broker Buyers - FileText Button
**File:** `/app/broker/buyers/page.tsx`
**Complexity:** Medium
**Dependencies:** Documents system/modal

**What's Needed:**
- Open documents modal for lead
- Show uploaded documents or document requests

---

### 31. Broker Matches - FileText Button
**File:** `/app/broker/matches/page.tsx`
**Complexity:** Medium
**Dependencies:** Documents system/modal

**What's Needed:**
- Same as above - documents modal

---

### 32-34. Conversations Phone Buttons
**Files:**
- `/app/agent/conversations/page.tsx`
- `/app/developer/conversations/page.tsx`
- `/app/broker/conversations/page.tsx`
**Complexity:** Simple each
**Dependencies:** None

**What's Needed:**
- Add tel: protocol to phone button onClick

---

## P3 - LOW PRIORITY (13 items)

### 35. Admin Billing - Create Invoice
**File:** `/app/admin/billing/page.tsx`
**Complexity:** Complex
**Dependencies:** Stripe API, invoice creation

**What's Needed:**
- Modal with invoice details
- Stripe API call to create invoice
- Send to customer

---

### 36. LeadDetail - Book Viewing Button
**File:** `/components/leads/LeadDetail.tsx`
**Complexity:** Complex
**Dependencies:** Viewing/appointment system

**What's Needed:**
- Viewing booking modal
- Date/time selection
- Calendar integration or simple DB storage
- Notification to lead

---

### 37. LeadDetail - Refer to Broker Button
**File:** `/components/leads/LeadDetail.tsx`
**Complexity:** Medium
**Dependencies:** Broker list, referral system

**What's Needed:**
- Modal with broker selection
- Create referral record
- Notify broker

---

### 38-47. Notification Preference Toggles (Remaining)
**Note:** Covered in P1 item #10, but individual toggles could be implemented incrementally:
- New Buyer Alerts
- Message Notifications
- Hot Lead Alerts
- Follow-up Reminders
- Priority Actions

---

## DEPENDENCIES MAP

```
Stripe Webhooks
├── P0: checkout.session.completed → profiles.subscription_tier
├── P0: subscription.updated → profiles.subscription_tier
├── P0: subscription.deleted → profiles.subscription_tier
└── P0: payment_failed → email notification

Notification Preferences
├── Requires: profiles.notification_preferences column
└── Affects: All 3 portal settings pages

Documents System (Future)
├── Requires: documents table, storage bucket
└── Affects: Broker buyers/matches FileText buttons

Viewing/Appointments (Future)
├── Requires: viewings table
└── Affects: LeadDetail Book Viewing button
```

---

## QUICK WINS (< 30 min each)

1. ✅ Finance Leads Phone/Email buttons - just add protocol links
2. ✅ Conversations Search - wire onChange to existing filter state
3. ✅ Conversations Card Click - add router.push
4. ✅ Conversations Phone Button - add tel: protocol
5. ✅ Dashboard Priority Lead buttons - add tel: and navigation
6. ✅ Matches Eye buttons - add navigation
7. ✅ Agent Buyers View button - add navigation
8. ✅ Billing Company Row Click - add navigation
9. ✅ Billing Stripe Dashboard - external link
10. ✅ LeadDetail Archive - add status update

---

## ESTIMATED EFFORT

| Priority | Items | Est. Hours |
|----------|-------|------------|
| P0 | 4 | 8-12 |
| P1 | 12 | 16-24 |
| P2 | 18 | 24-36 |
| P3 | 13 | 20-30 |
| **Total** | **47** | **68-102** |

---

## RECOMMENDED SPRINT PLAN

### Sprint 1: Critical Path
- [ ] Stripe webhook handlers (all 4)
- [ ] Bulk Assign modal
- [ ] Bulk Status Change modal
- [ ] Export to CSV

### Sprint 2: Core Workflows
- [ ] Quick Actions handler
- [ ] Finance Leads phone/email buttons
- [ ] Settings notification preferences (schema + 1 portal)
- [ ] LeadDetail Archive button

### Sprint 3: Polish
- [ ] Remaining notification toggles
- [ ] Conversations pages (search, cards, phone)
- [ ] Matches pages (all buttons)
- [ ] Dashboard priority lead buttons

### Sprint 4: Nice to Have
- [ ] Upload button
- [ ] Add Lead modal
- [ ] Analytics/Billing export reports
- [ ] Stripe dashboard link

---

*This checklist is for internal development planning only.*
