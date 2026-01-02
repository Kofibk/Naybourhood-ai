import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo, LogoIcon } from '@/components/Logo'
import {
  ArrowRight,
  Target,
  MessageSquare,
  CheckCircle,
  Building2,
  TrendingUp,
  Eye,
  Zap,
  Globe,
  Users,
  BadgePercent,
} from 'lucide-react'

const stats = [
  { value: '£1B+', label: 'Transaction Volume Sold by Our Clients' },
  { value: '12', label: 'Global Markets' },
  { value: '85%', label: 'Qualified Lead Rate' },
  { value: '5,000+', label: 'Verified Buyers' },
]

const steps = [
  {
    number: '1',
    title: 'Attract',
    description:
      'Smart campaigns across Meta, Google, TikTok and more, targeting qualified buyers based on budget, location, and real-time market demand.',
    icon: Target,
  },
  {
    number: '2',
    title: 'Qualify',
    description:
      'Every enquiry is scored by intent and buying power — so your team sees the right buyers, not a spreadsheet full of browsers.',
    icon: BadgePercent,
  },
  {
    number: '3',
    title: 'Nurture',
    description:
      'Automated follow-up across WhatsApp, email and SMS, triggered by buyer behaviour. Engage intelligently, and only when it counts.',
    icon: MessageSquare,
  },
  {
    number: '4',
    title: 'Convert',
    description:
      'Buyers are delivered to your CRM or inbox with full profile insight — verified, nurtured, and ready to act.',
    icon: CheckCircle,
  },
]

const solutions = [
  {
    title: 'Developers',
    description: 'Launching or scaling new developments',
    icon: Building2,
  },
  {
    title: 'Estate Agents',
    description: 'Seeking serious buyers for key listings',
    icon: Users,
  },
  {
    title: 'Marketing & PR Agencies',
    description: 'Adding performance property services',
    icon: TrendingUp,
  },
  {
    title: 'Financial Advisors & Banks',
    description: 'With international property portfolios',
    icon: Globe,
  },
]

const caseStudies = [
  {
    name: 'Chelsea Island',
    flag: '🇪🇬',
    result: '£5M reserved in 7 days',
    buyer: 'Egyptian investor',
    method: 'Meta + Google ads + nurture',
  },
  {
    name: 'The Lucan',
    flag: '🇳🇬',
    result: '£1.7M sale agreed in 30 days',
    buyer: 'Nigerian investor',
    method: 'UK & Ghana events + digital + lead scoring',
  },
  {
    name: 'Parkwood',
    flag: '🇬🇧',
    result: '£5M home sold in 3 days',
    buyer: 'UK residential family',
    method: 'Bespoke video + private outreach',
  },
  {
    name: 'One Clapham',
    flag: '🇦🇪',
    result: '£550K reservation secured',
    buyer: 'UAE investor',
    method: 'Targeted Google ads + CRM sync',
  },
]

const advantages = [
  {
    title: 'Built by performance marketers',
    description: 'With £50M+ in property sold',
    icon: TrendingUp,
  },
  {
    title: 'Reduces wasted viewings',
    description: 'And eliminates dead leads',
    icon: Target,
  },
  {
    title: 'Intelligent automation',
    description: 'That saves time and improves ROI',
    icon: Zap,
  },
  {
    title: 'Real-time visibility',
    description: 'On buyer behaviour and conversion',
    icon: Eye,
  },
]

const clients = [
  'Berkeley Group',
  'Mount Anvil',
  'London Square',
  'Hadley Property Group',
  'Regal London',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo variant="light" size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Login
            </Link>
            <Button asChild size="sm">
              <Link href="/login">Get Started</Link>
            </Button>
          </nav>
          <Button asChild size="sm" className="md:hidden">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium mb-6 max-w-4xl mx-auto leading-tight">
            The AI Property Sales
            <br />
            & Marketing Platform
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Attract high-intent buyers, qualify them intelligently, and manage
            conversion — all from one powerful platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/login">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Tour Platform</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              What We Do
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
              More Than Just Leads
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Naybourhood is the end-to-end platform built for property
              professionals who want more than just leads.
            </p>
            <p className="text-muted-foreground max-w-3xl mx-auto mt-4">
              We help developers, agents and advisors attract, qualify, and
              convert real buyers — combining campaign delivery, automation, and
              buyer intelligence into one seamless solution.
            </p>
            <p className="text-muted-foreground max-w-3xl mx-auto mt-4">
              Backed by the team behind Million Pound Homes, we have sold over
              £50M+ in property and now bring that same performance engine into
              your hands.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              How It Works
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">
              Four Steps to Conversion
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card
                key={i}
                className="bg-background hover:border-border/80 transition-colors relative"
              >
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions - Who It's For */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Solutions
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">
              Who It&apos;s For
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((solution, i) => (
              <Card
                key={i}
                className="bg-card hover:border-border/80 transition-colors"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <solution.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{solution.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {solution.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Proven Results
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-2">
              Case Studies
            </h2>
            <p className="text-muted-foreground">Global Reach, Local Results</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {caseStudies.map((study, i) => (
              <Card
                key={i}
                className="bg-background hover:border-border/80 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="text-3xl mb-3">{study.flag}</div>
                  <h3 className="font-semibold text-lg mb-2">{study.name}</h3>
                  <p className="text-primary font-medium mb-3">{study.result}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Buyer: {study.buyer}</p>
                    <p>{study.method}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Why It Works
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium">
              The Naybourhood Advantage
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((advantage, i) => (
              <Card
                key={i}
                className="bg-card hover:border-border/80 transition-colors"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <advantage.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{advantage.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 border-y border-border overflow-hidden">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted By
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {[...clients, ...clients].map((client, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Building2 className="h-5 w-5" />
                <span className="font-medium">{client}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-card border-border">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-8">
                Generate sales-ready buyers intelligently today
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/login">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about">Tour Platform</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-8 h-8" variant="light" />
              <span className="text-sm text-muted-foreground">
                © 2024 Naybourhood. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <a
                href="mailto:support@naybourhood.ai"
                className="hover:text-foreground"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
