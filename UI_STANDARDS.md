# UI_STANDARDS.md - Naybourhood Design System

## Theme: Giga-Inspired Dark Mode

Dark mode is the default and primary theme. All new UI must use this system.

### Colour Palette

| Token              | Value     | HSL                 | Usage                          |
|--------------------| ----------|---------------------|--------------------------------|
| Background         | `#0A0A0A` | `0 0% 4%`          | Page backgrounds               |
| Surface            | `#171717` | `0 0% 9%`          | Cards, panels, modals          |
| Accent (Emerald)   | `#34D399` | `160 84% 39%`      | CTAs, scores, success states   |
| Warning (Amber)    | `#FBBF24` | `43 96% 56%`       | Medium scores, caution states  |
| Info (Blue)        | `#60A5FA` | `217 91% 68%`      | Links, info badges             |
| Destructive (Red)  | `#EF4444` | `0 72% 51%`        | Errors, delete actions         |
| Text Primary       | `#F5F5F5` | `0 0% 96%`         | Main text on dark bg           |
| Text Muted         | `#A3A3A3` | `0 0% 64%`         | Secondary text                 |
| Border             | `#2E2E2E` | `0 0% 18%`         | Card borders, dividers         |

CSS variables are defined in `/app/globals.css` using HSL format: `hsl(var(--background))`.

### Font

**Inter** — all weights 300-700. Loaded via Google Fonts.

## Typography

| Element        | Size     | Weight | Tracking    | Line Height |
|----------------|----------|--------|-------------|-------------|
| h1             | 3.5rem   | 400    | -0.02em     | 1.15        |
| h2             | 2.5rem   | 400    | -0.01em     | 1.2         |
| h3             | 1.25rem  | 500    | normal      | 1.4         |
| Body           | 1rem     | 400    | normal      | 1.6         |
| Label/Caption  | 0.75rem  | 500    | 0.15em      | 1.0         |

Section labels use the green dot pattern:
```tsx
<div className="inline-flex items-center gap-3">
  <span className="w-2 h-2 rounded-full bg-[#34D399]" />
  <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
    SECTION LABEL
  </span>
</div>
```

## NB Score — Hero Metric

The **NB Score** is the single most important metric in the application. It must be displayed prominently on:

1. **Dashboard**: As the hero KPI card (first or largest card)
2. **Buyer Detail**: As a circular ring at the top of the profile
3. **Buyer List/Table**: As a compact number in the score column

### Calculation

```
NB Score = quality * 0.5 + intent * 0.3 + (confidence / 10 * 100) * 0.2
```

- Quality Score: 0-100 (Profile, Financial, Verification, Fit)
- Intent Score: 0-100 (Timeline, Purpose, Engagement, Commitment)
- Confidence Score: 0-10 (Data completeness)

### Visualization

**Circular Ring (NBScoreRing component)**:
- SVG circle with progress arc
- Emerald (`#34D399`) for score >= 70
- Amber (`#FBBF24`) for score >= 45
- Gray (`#6B7280`) for score < 45
- Score number centered inside the ring
- Available sizes: 48px (compact), 72px (standard), 96px (hero)

**Three sub-scores** shown below the ring:
- Quality, Intent, Confidence — each as a small bar or number

Component: `/components/ui/nb-score-ring.tsx`

## Classification Badges

Use `ClassificationBadge` from `/components/badges/ClassificationBadge.tsx`.

| Classification | Colour    | Icon         |
|---------------|-----------|--------------|
| Hot           | Red-500   | Flame        |
| Warm          | Orange-500| Thermometer  |
| Low           | Gray-400  | Snowflake    |

Sizes: `sm`, `md`, `lg`. Always use `showIcon` for clarity.

## Status Badges

Use `StatusBadge` from `/components/ui/status-badge.tsx`.

9 status types with distinct colours:
- Green: Completed, Exchanged, Reserved (positive outcomes)
- Amber: Contact Pending, Follow Up, Viewing Booked (in progress)
- Red: Not Proceeding, Disqualified (negative)
- Gray: Duplicate, Unknown

## Dashboard Cards

KPI cards follow this pattern:

```tsx
<div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
  <div className="flex items-center justify-between mb-3">
    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
      <IconComponent className="w-5 h-5 text-emerald-400" />
    </div>
  </div>
  <p className="text-white/50 text-sm">Metric Label</p>
  <p className="text-white text-3xl font-bold mt-1">Value</p>
</div>
```

## Shadows

- `giga`: `0 20px 40px rgba(0,0,0,0.3)` — cards on dark backgrounds
- `floating`: `0 25px 50px -12px rgba(0,0,0,0.5)` — elevated elements

## Spacing

- Section padding: `py-24 md:py-32`
- Container: `container mx-auto px-6`
- Card padding: `p-5` or `p-6`
- Gap between sections: `space-y-6`
- Grid gaps: `gap-4` (tight), `gap-6` (standard), `gap-8` (loose)

## Component Library

Base: shadcn/ui components in `/components/ui/`.

Custom components:
- `NBScoreRing` — circular score visualization
- `ClassificationBadge` — Hot/Warm/Low badges with icons
- `StatusBadge` — pipeline status indicators
- `PaymentBadge` — Cash/Mortgage badges
- `NextActionChip` — recommended action indicators
- `ScoreIndicator` — linear bar score display
- `ScoreDisplay` — composite score display (3 layouts)
- `KycStatusBadge` — verification status

## Responsive Breakpoints

Follow Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

All pages must work from 320px mobile to desktop. Use:
- Mobile-first approach
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for card grids
- Stacked layouts on mobile, side-by-side on desktop
- Collapsible sidebar on mobile

## Do Not

- Use inline styles — use Tailwind classes
- Hardcode colours — use CSS variables or Tailwind tokens
- Use light backgrounds for dashboard cards — always dark surface
- Skip loading states — use skeleton loaders
- Skip error states — show user-friendly error messages
- Use browser default form styling — style all inputs consistently
