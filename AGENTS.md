# Naybourhood UI Guidelines
## AGENTS.md — Apply to ALL UI code

This document defines UI standards for the entire Naybourhood platform. All components, pages, and features must follow these guidelines.

---

## 1. Foundation — Vercel Web Interface Guidelines

**All UI code must follow the [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines).** Key rules:

### Interactions
- **Keyboard works everywhere** — All flows are keyboard-operable, follow WAI-ARIA patterns
- **Clear focus** — Every focusable element shows visible focus ring (`:focus-visible`)
- **Loading buttons** — Show spinner + keep original label, never just swap text
- **Minimum loading duration** — 300ms minimum to avoid flicker
- **Enter submits** — Single input forms submit on Enter
- **Optimistic updates** — Update UI immediately, reconcile on server response
- **Confirm destructive actions** — Require confirmation or provide Undo
- **URL as state** — Persist filters, tabs, pagination in URL
- **Deep-link everything** — Filters, tabs, pagination, expanded panels

### Layout
- **Optical alignment** — Adjust ±1px when perception beats geometry
- **Responsive coverage** — Verify mobile, laptop, ultra-wide (50% zoom to simulate)
- **No excessive scrollbars** — Fix overflow issues
- **Respect safe areas** — Account for notches/insets

### Content
- **No dead ends** — Every screen offers next step or recovery
- **All states designed** — Empty, sparse, dense, error states
- **Tabular numbers** — Use `font-variant-numeric: tabular-nums` for data
- **Icons have labels** — For accessibility

### Forms
- **Labels everywhere** — Every control has a label
- **Don't pre-disable submit** — Allow submitting to surface validation
- **Error placement** — Show errors next to fields, focus first error on submit
- **Mobile input ≥16px** — Prevent iOS zoom

### Performance
- **Minimize re-renders** — Make them fast when they happen
- **Large lists** — Virtualize (use `virtua` or `content-visibility: auto`)
- **No image CLS** — Set explicit dimensions

### Animation
- **Honor `prefers-reduced-motion`**
- **Compositor-friendly** — Use `transform`, `opacity` only
- **Never `transition: all`** — Explicitly list properties
- **Interruptible** — Animations cancelable by user input

---

## 2. Design Tokens — Naybourhood Theme

### Colors

```css
/* Brand */
--brand: #10B981;           /* Emerald 500 - primary actions */
--brand-hover: #059669;     /* Emerald 600 */
--brand-muted: #10B98120;   /* 12% opacity for backgrounds */

/* Semantic */
--success: #10B981;
--warning: #F59E0B;         /* Amber 500 */
--error: #EF4444;           /* Red 500 */
--info: #3B82F6;            /* Blue 500 */

/* Surfaces (dark theme) */
--bg-base: #09090B;         /* Zinc 950 */
--bg-elevated: #18181B;     /* Zinc 900 */
--bg-muted: #27272A;        /* Zinc 800 */
--bg-subtle: #3F3F46;       /* Zinc 700 */

/* Borders */
--border-default: #27272A;  /* Zinc 800 */
--border-muted: #3F3F46;    /* Zinc 700 */
--border-focus: #10B981;    /* Brand */

/* Text */
--text-primary: #FAFAFA;    /* Zinc 50 */
--text-secondary: #A1A1AA;  /* Zinc 400 */
--text-muted: #71717A;      /* Zinc 500 */
--text-disabled: #52525B;   /* Zinc 600 */
```

### Typography

```css
/* Font family */
font-family: 'Inter', system-ui, sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - body small, table cells */
--text-base: 1rem;     /* 16px - body, inputs */
--text-lg: 1.125rem;   /* 18px - lead text */
--text-xl: 1.25rem;    /* 20px - card titles */
--text-2xl: 1.5rem;    /* 24px - page titles */
--text-3xl: 1.875rem;  /* 30px - hero text */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing

```css
/* Base unit: 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - small buttons, badges */
--radius-md: 0.5rem;     /* 8px - inputs, cards */
--radius-lg: 0.75rem;    /* 12px - modals, large cards */
--radius-xl: 1rem;       /* 16px - hero cards */
--radius-2xl: 1.5rem;    /* 24px - feature sections */
--radius-full: 9999px;   /* Pills, avatars */
```

### Shadows

```css
/* Layered shadows for depth */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);

/* Glow for cards */
--glow-brand: 0 0 40px rgba(16, 185, 129, 0.15);
```

### Z-Index Scale

```css
--z-dropdown: 50;
--z-sticky: 100;
--z-modal-backdrop: 200;
--z-modal: 300;
--z-popover: 400;
--z-tooltip: 500;
--z-toast: 600;
```

---

## 3. Component Patterns

### Buttons

```tsx
// Primary - main actions
<Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
  Save Changes
</Button>

// Secondary - less prominent
<Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
  Cancel
</Button>

// Ghost - minimal
<Button variant="ghost" className="hover:bg-zinc-800">
  Learn More
</Button>

// Destructive - dangerous actions
<Button variant="destructive" className="bg-red-500 hover:bg-red-600">
  Delete
</Button>

// Loading state - ALWAYS show spinner + keep label
<Button disabled={isLoading}>
  {isLoading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
  Save Changes
</Button>
```

### Inputs

```tsx
// Standard input
<Input
  className="bg-zinc-800 border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-base" // text-base = 16px, prevents iOS zoom
  placeholder="Enter value..."
/>

// With prefix
<div className="flex">
  <span className="bg-zinc-800 border border-zinc-700 border-r-0 rounded-l-lg px-3 py-2 text-zinc-400">
    https://
  </span>
  <Input className="rounded-l-none" />
</div>

// With error
<div>
  <Input className="border-red-500 focus:border-red-500 focus:ring-red-500" />
  <p className="text-red-400 text-sm mt-1">This field is required</p>
</div>
```

### Cards

```tsx
// Standard card
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
  {/* content */}
</div>

// Elevated card (glow)
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg" style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.1)' }}>
  {/* content */}
</div>

// Interactive card
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors cursor-pointer">
  {/* content */}
</div>

// Selected card
<div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-xl p-6">
  {/* content */}
</div>
```

### Tables

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-zinc-800">
      <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider py-3 px-4">
        Name
      </th>
      {/* ... */}
    </tr>
  </thead>
  <tbody className="divide-y divide-zinc-800">
    <tr className="hover:bg-zinc-800/50 transition-colors">
      <td className="py-4 px-4 text-sm">
        {/* Use tabular-nums for numbers */}
        <span className="font-variant-numeric: tabular-nums">£1,250,000</span>
      </td>
    </tr>
  </tbody>
</table>
```

### Badges / Status Indicators

```tsx
// Lead classification badges
<span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
  Hot Lead
</span>
<span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
  Qualified
</span>
<span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
  Needs Qualification
</span>
<span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400">
  Nurture
</span>

// Score badges (use tabular-nums)
<span className="font-variant-numeric: tabular-nums px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-sm font-medium">
  85/100
</span>
```

### Modals

```tsx
<Dialog>
  <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Modal Title</DialogTitle>
      <DialogDescription className="text-zinc-400">
        Description text here
      </DialogDescription>
    </DialogHeader>

    {/* Content */}
    <div className="py-4">
      {/* ... */}
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-3">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </div>
  </DialogContent>
</Dialog>

// CRITICAL: Modals must trap focus and close on Escape
```

### Banners / Alerts

```tsx
// Info (blue)
<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
    <div>
      <h3 className="font-medium text-blue-400">Info title</h3>
      <p className="text-sm text-zinc-400 mt-1">Description</p>
    </div>
  </div>
</div>

// Warning (yellow)
<div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
  {/* Same structure, yellow colors */}
</div>

// Error (red)
<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
  {/* Same structure, red colors */}
</div>

// Success (green)
<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
  {/* Same structure, emerald colors */}
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
    <Users className="w-8 h-8 text-zinc-500" />
  </div>
  <h3 className="text-lg font-medium mb-2">No leads yet</h3>
  <p className="text-zinc-400 text-sm max-w-sm mb-6">
    Leads will appear here once your campaigns start generating enquiries.
  </p>
  <Button>Create Campaign</Button>
</div>
```

### Loading States

```tsx
// Skeleton loader
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-zinc-800 rounded w-3/4" />
  <div className="h-4 bg-zinc-800 rounded w-1/2" />
  <div className="h-4 bg-zinc-800 rounded w-5/6" />
</div>

// Spinner
<svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
</svg>

// CRITICAL: Minimum 300ms display time to avoid flicker
```

---

## 4. Page Layouts

### Dashboard Layout

```tsx
<div className="min-h-screen bg-zinc-950">
  {/* Sidebar - fixed */}
  <aside className="fixed inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800">
    {/* Logo */}
    <div className="h-16 flex items-center px-6 border-b border-zinc-800">
      <Logo />
    </div>

    {/* Navigation */}
    <nav className="p-4 space-y-1">
      <NavItem icon={Home} label="Dashboard" href="/dashboard" active />
      <NavItem icon={Users} label="Leads" href="/leads" />
      <NavItem icon={BarChart} label="Campaigns" href="/campaigns" />
      <NavItem icon={Settings} label="Settings" href="/settings" />
    </nav>
  </aside>

  {/* Main content */}
  <main className="ml-64">
    {/* Top bar */}
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <UserMenu />
    </header>

    {/* Page content */}
    <div className="p-6">
      {children}
    </div>
  </main>
</div>
```

### Stats Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <StatCard
    label="Total Leads"
    value="1,565"
    change="+12%"
    trend="up"
    icon={Users}
  />
  <StatCard
    label="Hot Leads"
    value="115"
    change="+8%"
    trend="up"
    icon={Flame}
  />
  {/* ... */}
</div>

// StatCard component
function StatCard({ label, value, change, trend, icon: Icon }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-zinc-400 text-sm">{label}</span>
        <Icon className="w-5 h-5 text-zinc-500" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        <span className={cn(
          "text-sm font-medium",
          trend === 'up' ? 'text-emerald-400' : 'text-red-400'
        )}>
          {change}
        </span>
      </div>
    </div>
  );
}
```

### Data Table Page

```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold">Leads</h1>
      <p className="text-zinc-400 mt-1">Manage and track your buyer leads</p>
    </div>
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      Add Lead
    </Button>
  </div>

  {/* Filters */}
  <div className="flex items-center gap-4">
    <Input
      placeholder="Search leads..."
      className="w-64"
    />
    <Select>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      {/* ... */}
    </Select>
    <Select>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Classification" />
      </SelectTrigger>
      {/* ... */}
    </Select>
  </div>

  {/* Table */}
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
    <Table>
      {/* ... */}
    </Table>
  </div>

  {/* Pagination */}
  <div className="flex items-center justify-between">
    <span className="text-sm text-zinc-400">
      Showing 1-20 of 1,565 leads
    </span>
    <Pagination />
  </div>
</div>
```

### Settings Page

```tsx
<div className="max-w-2xl space-y-8">
  {/* Section */}
  <div>
    <h2 className="text-lg font-semibold mb-1">Profile</h2>
    <p className="text-zinc-400 text-sm mb-6">
      Update your personal information
    </p>

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First name</Label>
          <Input className="mt-1" />
        </div>
        <div>
          <Label>Last name</Label>
          <Input className="mt-1" />
        </div>
      </div>
      {/* ... */}
    </div>
  </div>

  {/* Danger zone */}
  <div>
    <h2 className="text-lg font-semibold mb-1 text-red-400">Danger Zone</h2>
    <p className="text-zinc-400 text-sm mb-6">
      Irreversible actions
    </p>

    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Delete account</h3>
          <p className="text-sm text-zinc-400">Permanently delete your account and all data</p>
        </div>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  </div>
</div>
```

---

## 5. Naybourhood-Specific Patterns

### Lead Score Display

```tsx
// Score with color coding
function LeadScore({ score, type }: { score: number; type: 'quality' | 'intent' | 'confidence' }) {
  const getColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/20';
    if (score >= 50) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div className="text-center">
      <span className={cn(
        "inline-block px-3 py-1 rounded-lg text-lg font-semibold tabular-nums",
        getColor(score)
      )}>
        {score}
      </span>
      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">
        {type}
      </p>
    </div>
  );
}
```

### Lead Card (for lead detail page)

```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
  {/* Header with classification */}
  <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
        <span className="text-emerald-400 font-semibold">JW</span>
      </div>
      <div>
        <h2 className="font-semibold">James Wilson</h2>
        <p className="text-sm text-zinc-400">London Square</p>
      </div>
    </div>
    <Badge variant="hot">Hot Lead</Badge>
  </div>

  {/* Scores */}
  <div className="grid grid-cols-3 divide-x divide-zinc-800 py-6">
    <LeadScore score={85} type="quality" />
    <LeadScore score={92} type="intent" />
    <LeadScore score={78} type="confidence" />
  </div>

  {/* Details */}
  <div className="px-6 py-4 border-t border-zinc-800 space-y-3">
    <DetailRow label="Budget" value="£1.2M - £1.5M" />
    <DetailRow label="Bedrooms" value="3 bed" />
    <DetailRow label="Purpose" value="Primary residence" />
    <DetailRow label="Timeline" value="Within 28 days" highlight />
  </div>

  {/* Actions */}
  <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
    <Button className="flex-1">
      <Phone className="w-4 h-4 mr-2" />
      Call
    </Button>
    <Button variant="outline" className="flex-1">
      <Mail className="w-4 h-4 mr-2" />
      Email
    </Button>
    <Button variant="outline" className="flex-1">
      <MessageCircle className="w-4 h-4 mr-2" />
      WhatsApp
    </Button>
  </div>
</div>
```

### Campaign Card

```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="font-semibold">{campaign.name}</h3>
      <p className="text-sm text-zinc-400">{campaign.development}</p>
    </div>
    <StatusBadge status={campaign.status} />
  </div>

  <div className="grid grid-cols-3 gap-4 mb-4">
    <div>
      <p className="text-2xl font-semibold tabular-nums">{campaign.leads}</p>
      <p className="text-xs text-zinc-500">Leads</p>
    </div>
    <div>
      <p className="text-2xl font-semibold tabular-nums">£{campaign.spend}</p>
      <p className="text-xs text-zinc-500">Spend</p>
    </div>
    <div>
      <p className="text-2xl font-semibold tabular-nums">£{campaign.cpl}</p>
      <p className="text-xs text-zinc-500">CPL</p>
    </div>
  </div>

  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-emerald-500 rounded-full"
        style={{ width: `${campaign.qualifiedRate}%` }}
      />
    </div>
    <span className="text-sm text-zinc-400 tabular-nums">{campaign.qualifiedRate}%</span>
  </div>
</div>
```

### AI Recommendation Card

```tsx
<div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
      <Sparkles className="w-4 h-4 text-emerald-400" />
    </div>
    <div>
      <h4 className="font-medium text-emerald-400">AI Recommendation</h4>
      <p className="text-sm text-zinc-300 mt-1">
        Schedule viewing within 24 hours. This is a cash buyer with 28-day timeline.
      </p>
      <Button size="sm" className="mt-3">
        Schedule Viewing
      </Button>
    </div>
  </div>
</div>
```

---

## 6. Accessibility Requirements

### Focus Management
- All interactive elements must have visible focus rings
- Use `:focus-visible` to avoid showing focus on click
- Modals must trap focus
- After closing modal, return focus to trigger element

### Keyboard Navigation
- Tab order must be logical (left-to-right, top-to-bottom)
- All functionality accessible via keyboard
- Escape closes modals/dropdowns
- Enter activates buttons/links
- Arrow keys navigate within lists/grids

### Screen Readers
- All images have `alt` text
- Icon-only buttons have `aria-label`
- Form inputs have associated labels
- Dynamic content uses `aria-live` regions
- Use semantic HTML (`<nav>`, `<main>`, `<article>`, etc.)

### Color Contrast
- Text contrast minimum 4.5:1 (normal text)
- Large text contrast minimum 3:1
- Never convey information with color alone
- Provide text labels alongside color indicators

### Motion
- Respect `prefers-reduced-motion`
- Provide reduced/no motion alternatives
- Avoid auto-playing animations

---

## 7. Mobile Considerations

### Touch Targets
- Minimum 44x44px for all interactive elements
- Add padding to small icons to expand hit area

### Input Fields
- Font size ≥16px to prevent iOS zoom
- Use appropriate `inputmode` for virtual keyboards
- Place labels above inputs (not inline)

### Navigation
- Use bottom navigation on mobile
- Hamburger menu for overflow items
- Swipe gestures for common actions

### Layout
- Single column on mobile
- Stack form fields vertically
- Full-width buttons on mobile

---

## 8. Code Review Checklist

Before submitting any UI code, verify:

### Structure
- [ ] Uses semantic HTML elements
- [ ] Components are properly typed (TypeScript)
- [ ] No inline styles (use Tailwind classes)
- [ ] Proper component file organization

### Interactions
- [ ] All interactive elements focusable
- [ ] Loading states show spinner + keep label
- [ ] Forms validate on submit, focus first error
- [ ] Destructive actions require confirmation
- [ ] Optimistic updates where appropriate

### Accessibility
- [ ] All inputs have labels
- [ ] Icon buttons have aria-label
- [ ] Color contrast meets requirements
- [ ] Keyboard navigation works

### Responsiveness
- [ ] Tested on mobile viewport
- [ ] Touch targets ≥44px
- [ ] Input font size ≥16px
- [ ] No horizontal scroll

### Performance
- [ ] Images have explicit dimensions
- [ ] Large lists are virtualized
- [ ] No unnecessary re-renders
- [ ] Animations use transform/opacity only

---

## 9. File Naming & Organization

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── callback/
│       └── route.ts
├── (dashboard)/
│   ├── layout.tsx              # Dashboard shell
│   ├── developer/
│   │   └── page.tsx
│   ├── leads/
│   │   ├── page.tsx            # List view
│   │   └── [id]/
│   │       └── page.tsx        # Detail view
│   ├── campaigns/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
└── onboarding/
    ├── page.tsx
    └── components/
        ├── StepOne.tsx
        └── StepTwo.tsx

components/
├── ui/                         # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── banners/
│   ├── EmailVerifyBanner.tsx
│   └── PendingApprovalBanner.tsx
├── leads/
│   ├── LeadCard.tsx
│   ├── LeadScore.tsx
│   └── LeadTable.tsx
├── campaigns/
│   └── CampaignCard.tsx
└── layout/
    ├── Sidebar.tsx
    ├── Header.tsx
    └── UserMenu.tsx

lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
├── utils.ts
└── validations/
    └── schemas.ts
```

---

*Guidelines Version: 1.0 | January 2026*
*Apply to all Naybourhood UI code*
