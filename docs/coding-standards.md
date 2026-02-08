
# Naybourhood Coding Standards


All code in this repo must follow these rules.
Reference this file before making any changes.


## Architecture
- Every React component must be under 300 lines. If longer, split it.
- Every page uses React Query hooks for data. No direct Supabase calls in components.
- No .select('*') queries. Always specify columns.
- Every Supabase query must be paginated with .range(). Max 50 rows per request.
- Dashboard stats use .count() or aggregate queries, never fetch-all-and-count.
- All filtering and sorting happens at database level, not client-side.


## Data Layer
- All data hooks live in /hooks/ directory.
- Every mutation must have onSuccess (invalidate cache), onError (show error).
- staleTime minimum 5 minutes. gcTime minimum 30 minutes.
- Never send read-only or system columns in updates (id, created_at, airtable_id).
- Every mutation must clear loading state in finally block. Never hang on 'saving...'.


## Components
- All shared UI components live in /components/ui/ and use shadcn/ui.
- No inline styles. Use Tailwind classes only.
- Every component must have TypeScript props interface.
- No 'any' types. Define proper types for all data.
- Use the existing shared components: DataTable, StatusBadge, ScoreIndicator,
  PageHeader, EmptyState, LoadingState, FilterBar, ConfirmDialog.


## Error Handling
- Every async operation wrapped in try/catch.
- Errors shown to user via toast notification, never silent failures.
- Loading states must always clear on both success and error.


## Performance
- Images use next/image, not raw img tags.
- No data fetching in useEffect. Use React Query hooks.
- Lazy load components below the fold.
- Mobile responsive: all pages must work from 320px to desktop.


## File Structure
- Pages: /app/ (Next.js App Router)
- Hooks: /hooks/
- Components: /components/
- Utilities: /lib/
- Types: /types/


These standards apply to ALL new code and any code being modified.
