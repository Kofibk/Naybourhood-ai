# Naybourhood - AI-Powered Property Lead Intelligence

A comprehensive web application for property developers, agents, and brokers to qualify leads, optimize campaigns, and close more deals using AI-powered insights.

## Features

### Multi-Role Support
- **Admin Dashboard**: Full control with analytics, campaign management, lead scoring
- **Developer Portal**: Buyer management and campaign insights
- **Agent Portal**: Lead management and client communication
- **Broker Portal**: Client qualification and finance lead management

### Core Functionality
- Real-time Analytics: Track CPL, conversion rates, and ROI
- Lead Scoring: AI-powered quality (Q) and intent (I) scoring
- Campaign Management: Monitor and optimize ad campaigns
- Conversion Funnel: Track leads from acquisition to close
- Finance Leads: Mortgage and bridging finance lead management

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Database, Auth, Realtime)
- Stripe (Payments)

## Getting Started

```bash
npm install
npm run dev      # Development server
npm run build    # Production build
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Authentication

Authentication is handled via Supabase Auth using magic link (passwordless) login. Users are managed through the Supabase dashboard or via user invitations from the admin panel.

## License

MIT - Built by Naybourhood / MPH Group
