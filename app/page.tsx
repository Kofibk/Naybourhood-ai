import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Target,
  CheckCircle,
  Building2,
  Zap,
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    description:
      'Get instant recommendations on lead quality, campaign optimization, and conversion strategies.',
  },
  {
    icon: Target,
    title: 'Lead Scoring',
    description:
      'Automatically score and classify leads based on quality, intent, and purchase timeline.',
  },
  {
    icon: BarChart3,
    title: 'Campaign Analytics',
    description:
      'Track CPL, conversion rates, and ROI across all your marketing campaigns.',
  },
  {
    icon: Users,
    title: 'Buyer Management',
    description:
      'Manage your entire buyer pipeline from first contact to completion.',
  },
]

const stats = [
  { value: '£325K', label: 'ARR' },
  { value: '1,500+', label: 'Leads Processed' },
  { value: '48%', label: 'Avg CPL Reduction' },
  { value: '12', label: 'Premium Clients' },
]

const clients = [
  'Berkeley Group',
  'Regal London',
  'JLL',
  'Mount Anvil',
  'Hadley Property',
  'London Square',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold">N</span>
            </div>
            <span className="font-semibold tracking-wide">NAYBOURHOOD</span>
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
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" /> AI-Powered Lead Intelligence
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-medium mb-6 max-w-4xl mx-auto">
            Convert More Property Leads with AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The intelligent platform that helps property developers, agents, and
            brokers qualify leads faster, optimize campaigns, and close more deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/login">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Learn More</Link>
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

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
              Everything You Need to Convert Leads
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From lead capture to conversion, our AI-powered platform handles it
              all.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="bg-card hover:border-border/80 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by leading property developers
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {clients.map((client, i) => (
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
              <h2 className="font-display text-3xl md:text-4xl font-medium mb-4">
                Ready to Transform Your Lead Conversion?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join premium property developers who are already using Naybourhood
                to qualify leads faster and close more deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/login">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" /> No credit card
                  required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" /> 14-day free
                  trial
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">N</span>
              </div>
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
