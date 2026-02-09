# Naybourhood — Agent Guidelines

## Project Overview

Naybourhood is an AI-powered property lead intelligence platform. It serves
four user roles: **Admin**, **Developer**, **Agent**, and **Broker**.

## Key Concepts

- **NB Score**: The Naybourhood Score — a single 0-100 metric combining Quality
  and Intent scores. This is the hero metric on every buyer-facing screen.
- **Classification**: AI-driven label (Hot, Warm-Qualified, Warm-Engaged,
  Nurture, Cold, Disqualified) derived from the scoring matrix.
- **Risk Flags**: Short warnings (e.g. "No proof of funds") surfaced by the
  scoring engine. Always displayed as inline badges, never bullet lists.

## Standards

Before modifying any UI that displays buyer data, read:

- **`UI_STANDARDS.md`** — visual rules for scores, badges, risk flags, and AI
  content.
- **`docs/coding-standards.md`** — architecture, data layer, component, and
  performance rules.

## Scoring System

Located in `lib/scoring/naybourhood-scoring.ts`. Priority order:

1. Financial Proceedability (cash, proof of funds, mortgage status)
2. Commitment Signals (timeline, viewing intent, status progression)
3. Realism (budget match, bedroom match, location fit)
4. Engagement (source quality, replies, communication history)

## File Layout

```
app/           → Next.js App Router pages (thin wrappers per role)
components/    → React components organised by feature
  badges/      → ClassificationBadge, RiskFlagBadge, StatusBadge, etc.
  scoring/     → NBScoreHero, ScoreBar, ScoreDisplay
  leads/       → LeadCard, LeadTable, LeadDetail, detail/*
  shared/      → BuyerCardGrid, LeadManagementPage, DashboardPage
  ai/          → AIBuyerSummary, AIInsights
  dashboard/   → HotLeadsWidget, PipelineOverview, PriorityActions
  ui/          → Base shadcn/ui primitives
hooks/         → React Query data hooks
lib/           → Utilities, scoring engine, queries
types/         → TypeScript definitions
```
