# Naybourhood UI Standards

Every page and component that displays buyer/lead data **must** follow these rules.

---

## 1. NB Score — Hero Metric

The **NB Score** (Naybourhood Score) is the single most important number on any
buyer-data screen. It is computed as:

```
nbScore = Math.round((qualityScore + intentScore) / 2)
```

Display rules:
- Render the NB Score **first and largest** on the page (hero position).
- Use the `<NBScoreHero>` component from `components/scoring/NBScoreHero.tsx`.
- Colour thresholds:
  - **70–100** → green (`text-emerald-600`, `bg-emerald-500`)
  - **45–69**  → amber (`text-amber-600`, `bg-amber-500`)
  - **0–44**   → grey  (`text-gray-500`, `bg-gray-400`)
- Quality and Intent may still appear as secondary metrics below the hero.

---

## 2. Classification Badges — Colour-Coded

Use the `<ClassificationBadge>` component from `components/badges/ClassificationBadge.tsx`.

| Classification   | Background       | Text    | Icon        |
|------------------|------------------|---------|-------------|
| Hot              | `bg-red-500`     | white   | Flame       |
| Warm-Qualified   | `bg-orange-500`  | white   | Thermometer |
| Warm-Engaged     | `bg-amber-500`   | white   | Thermometer |
| Nurture          | `bg-blue-400`    | white   | Sparkles    |
| Cold             | `bg-gray-400`    | white   | Snowflake   |
| Disqualified     | `bg-gray-600`    | white   | XCircle     |

Every list row, card, and detail page that shows a buyer **must** include the
classification badge next to or near the NB Score.

---

## 3. Risk Flags — Inline Badges

Risk flags **must** be rendered as inline `<Badge>` components (amber/yellow),
**not** as bullet-point lists.

Use the `<RiskFlagBadge>` component from `components/badges/RiskFlagBadge.tsx`.

```tsx
<div className="flex flex-wrap gap-1.5">
  {riskFlags.map((flag, i) => (
    <RiskFlagBadge key={i} flag={flag} />
  ))}
</div>
```

Each badge:
- Yellow/amber background: `bg-yellow-100 text-yellow-800 border-yellow-300`
- Small AlertTriangle icon before text
- Size: `text-xs`, `px-2 py-0.5`

---

## 4. AI Summary & Recommendations

### AI Summary
- Displayed inside a `Card` with a `Bot` icon header.
- Summary text in a `bg-muted/50` block with `text-sm leading-relaxed`.

### Recommendations
- Numbered list (`<ol>`) or bulleted with arrow icons.
- Each item: `text-sm` with a primary-colour arrow/bullet.

### Next Action
- Highlighted card with `border-primary/50 bg-primary/5`.
- `Target` icon + label "Next Action" in primary colour.
- Action text in `text-sm font-medium`.

---

## 5. Where These Rules Apply

Any page or component that renders buyer/lead data, including but not limited to:
- `BuyerCardGrid` (agent/broker buyer lists)
- `LeadManagementPage` (developer buyers, broker borrowers)
- `LeadCard` / `LeadCardGrid` / `LeadTable`
- `LeadDetail` (agent lead detail)
- `AIBuyerSummary`
- `LeadHeader` + `LeadAIInsights` (admin detail)
- `HotLeadsWidget` (dashboards)
- All buyer detail pages (`/admin/leads/[id]`, `/developer/buyers/[id]`, etc.)

---

## Quick Compliance Checklist

- [ ] NB Score displayed as hero metric (largest number, first position)
- [ ] Classification badge present and colour-coded per table above
- [ ] Risk flags rendered as inline amber badges (not bullet lists)
- [ ] AI Summary in muted card with Bot icon
- [ ] Recommendations as numbered/bulleted list with arrows
- [ ] Next Action in highlighted primary card with Target icon
