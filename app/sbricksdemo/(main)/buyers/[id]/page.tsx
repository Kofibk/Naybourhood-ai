'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { SB_DEMO_RECENT_LEADS } from '@/lib/demo-data-smartbricks'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  User,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Linkedin,
  Briefcase,
  GraduationCap,
  Globe,
  Newspaper,
  Award,
  FileText,
  Search,
  BadgeCheck,
  CircleDot,
} from 'lucide-react'

const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string; ringBg: string }> = {
  'Hot Lead': { bg: 'bg-red-600', text: 'text-white', label: 'Hot Lead', ringBg: 'bg-red-500/10 border-red-500/30' },
  'Qualified': { bg: 'bg-emerald-600', text: 'text-white', label: 'Qualified', ringBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Needs Qualification': { bg: 'bg-amber-500', text: 'text-white', label: 'Needs Qualification', ringBg: 'bg-amber-500/10 border-amber-500/30' },
  'Nurture': { bg: 'bg-blue-500', text: 'text-white', label: 'Nurture', ringBg: 'bg-blue-500/10 border-blue-500/30' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold', ringBg: 'bg-gray-400/10 border-gray-400/30' },
}

// Buyer intelligence data keyed by lead ID
const BUYER_INTELLIGENCE: Record<string, {
  overview: string
  occupation: string
  estimatedIncome: string
  address: string
  companyAssociations: { name: string; role: string; sector: string }[]
  prNewsAchievements: { title: string; source: string; date: string }[]
  mediaReporting: { headline: string; outlet: string; date: string; sentiment: 'positive' | 'neutral' | 'negative' }[]
  linkedinUrl: string
  linkedinHeadline: string
  estimatedNetWorth: string
  phoneVerified: boolean
  phoneCarrier: string
  phoneType: string
  emailVerified: boolean
  emailDomain: string
  emailType: string
  workHistory: { company: string; role: string; period: string; current: boolean }[]
  educationHistory: { institution: string; degree: string; field: string; year: string }[]
}> = {
  'sb-lead-001': {
    overview: 'Khalid Al-Maktoum is a Dubai-based ultra-high-net-worth investor with an extensive real estate portfolio spanning prime locations across the UAE, London, and Monaco. His verified AED 25M+ position through Emirates NBD Private Banking confirms immediate purchasing capacity. As a member of a prominent Emirati business family, he has deep connections across the UAE property market.',
    occupation: 'Chairman, Al-Maktoum Investments',
    estimatedIncome: 'AED 8,000,000 - 12,000,000 p.a.',
    address: 'Villa 42, Emirates Hills, Dubai, UAE',
    companyAssociations: [
      { name: 'Al-Maktoum Investments', role: 'Chairman', sector: 'Private Equity / Real Estate' },
      { name: 'Dubai Land Department', role: 'Advisory Board Member', sector: 'Government / Real Estate' },
      { name: 'Palm Jumeirah Owners Association', role: 'Board Member', sector: 'Property Management' },
    ],
    prNewsAchievements: [
      { title: 'Al-Maktoum Investments closes AED 500M residential fund', source: 'Arabian Business', date: '2025-11-20' },
      { title: 'Named in Gulf Business "Top 50 Real Estate Investors"', source: 'Gulf Business', date: '2025-09-15' },
      { title: 'Keynote at Cityscape Global: Future of Luxury Living', source: 'Cityscape', date: '2025-10-12' },
    ],
    mediaReporting: [
      { headline: 'Al-Maktoum family office expands Palm Jumeirah portfolio', outlet: 'The National', date: '2025-12-01', sentiment: 'positive' },
      { headline: 'UHNW investors drive Dubai ultra-prime market to new highs', outlet: 'Knight Frank', date: '2025-10-18', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/khalidalmaktoum',
    linkedinHeadline: 'Chairman at Al-Maktoum Investments | Real Estate | Private Equity',
    estimatedNetWorth: '$80M - $120M',
    phoneVerified: true,
    phoneCarrier: 'Etisalat',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'maktoum-inv.ae (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Al-Maktoum Investments', role: 'Chairman', period: '2015 - Present', current: true },
      { company: 'Emaar Properties', role: 'Vice President, Luxury Residential', period: '2010 - 2015', current: false },
      { company: 'Dubai Holding', role: 'Director of Investments', period: '2006 - 2010', current: false },
    ],
    educationHistory: [
      { institution: 'London Business School', degree: 'MBA', field: 'Finance & Strategy', year: '2006' },
      { institution: 'American University of Dubai', degree: 'BSc', field: 'Business Administration', year: '2003' },
    ],
  },
  'sb-lead-002': {
    overview: 'Oliver Hartley is a London-based property investor with a portfolio of 8 UK residential properties and growing interest in Dubai\'s rental market. As Director at London Capital Partners, he manages a £150M+ portfolio and has verified proof of funds at £2.1M through Barclays Private. His experience in UK property gives him strong market knowledge, and he is now expanding internationally for yield.',
    occupation: 'Director, London Capital Partners',
    estimatedIncome: '£350,000 - £500,000 p.a.',
    address: '28 Kensington Palace Gardens, London W8 4QY',
    companyAssociations: [
      { name: 'London Capital Partners', role: 'Director', sector: 'Property Investment' },
      { name: 'UK-UAE Business Council', role: 'Member', sector: 'Trade Association' },
      { name: 'RICS', role: 'Fellow (FRICS)', sector: 'Professional Body' },
    ],
    prNewsAchievements: [
      { title: 'London Capital Partners enters Dubai market with £50M allocation', source: 'Property Week', date: '2025-10-22' },
      { title: 'Speaker at MIPIM: Cross-border residential investment', source: 'MIPIM', date: '2025-10-08' },
    ],
    mediaReporting: [
      { headline: 'UK investors flock to Dubai for superior rental yields', outlet: 'Financial Times', date: '2025-11-15', sentiment: 'positive' },
      { headline: 'London fund managers diversify into Gulf real estate', outlet: 'React News', date: '2025-10-03', sentiment: 'neutral' },
    ],
    linkedinUrl: 'https://linkedin.com/in/oliverhartley',
    linkedinHeadline: 'Director at London Capital Partners | Property Investment | FRICS',
    estimatedNetWorth: '£12M - £18M',
    phoneVerified: true,
    phoneCarrier: 'EE Business',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'londoncap.co.uk (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'London Capital Partners', role: 'Director', period: '2018 - Present', current: true },
      { company: 'Savills', role: 'Associate Director, Capital Markets', period: '2013 - 2018', current: false },
      { company: 'CBRE', role: 'Senior Analyst, Residential', period: '2010 - 2013', current: false },
    ],
    educationHistory: [
      { institution: 'University of Cambridge', degree: 'MA', field: 'Land Economy', year: '2010' },
      { institution: 'RICS Qualification', degree: 'FRICS', field: 'Chartered Surveying', year: '2014' },
    ],
  },
  'sb-lead-003': {
    overview: 'Rajesh Patel is a Mumbai-based HNW investor expanding his UAE property portfolio. He currently owns 2 units in Business Bay and is looking at Creek Vista for capital growth. His family runs the Patel Group, a diversified conglomerate with interests in real estate, pharmaceuticals, and technology across India and the Middle East.',
    occupation: 'Managing Director, Patel Group International',
    estimatedIncome: '₹50,000,000 - 80,000,000 p.a.',
    address: 'Patel House, Worli Sea Face, Mumbai 400018, India',
    companyAssociations: [
      { name: 'Patel Group International', role: 'Managing Director', sector: 'Diversified Conglomerate' },
      { name: 'India-UAE Business Council', role: 'Executive Committee Member', sector: 'Trade Association' },
      { name: 'Dubai Business Bay Owners Association', role: 'Member', sector: 'Property Management' },
    ],
    prNewsAchievements: [
      { title: 'Patel Group allocates $20M to UAE real estate expansion', source: 'Economic Times', date: '2025-09-18' },
      { title: 'Named in Forbes India "Emerging Business Leaders"', source: 'Forbes India', date: '2025-07-05' },
    ],
    mediaReporting: [
      { headline: 'Indian investors drive 30% increase in Dubai off-plan purchases', outlet: 'Gulf News', date: '2025-11-08', sentiment: 'positive' },
      { headline: 'India-UAE investment corridor reaches new milestone', outlet: 'The National', date: '2025-10-12', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/rajeshpatel-mumbai',
    linkedinHeadline: 'MD at Patel Group International | Real Estate | Cross-border Investment',
    estimatedNetWorth: '$15M - $25M (Family)',
    phoneVerified: true,
    phoneCarrier: 'Jio',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'patel-group.in (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Patel Group International', role: 'Managing Director', period: '2019 - Present', current: true },
      { company: 'Patel Group International', role: 'VP, International Investments', period: '2015 - 2019', current: false },
      { company: 'JP Morgan (Mumbai)', role: 'Associate, Real Estate Banking', period: '2012 - 2015', current: false },
    ],
    educationHistory: [
      { institution: 'Indian School of Business, Hyderabad', degree: 'MBA (PGP)', field: 'Finance & Strategy', year: '2012' },
      { institution: 'University of Mumbai', degree: 'BCom (Hons)', field: 'Accounting & Finance', year: '2009' },
    ],
  },
  'sb-lead-004': {
    overview: 'Sophie Laurent is a Paris-based luxury real estate investor relocating her family to Dubai. As a Partner at Laurent & Associés, she manages a €100M+ portfolio of residential properties across Paris, London, and the Côte d\'Azur. Her confirmed budget and scheduled viewing at Palm Residences indicate strong purchasing intent.',
    occupation: 'Partner, Laurent & Associés',
    estimatedIncome: '€400,000 - 600,000 p.a.',
    address: '16 Avenue Montaigne, 75008 Paris, France',
    companyAssociations: [
      { name: 'Laurent & Associés', role: 'Partner & Co-Founder', sector: 'Real Estate Investment' },
      { name: 'French-UAE Chamber of Commerce', role: 'Board Member', sector: 'Trade Association' },
    ],
    prNewsAchievements: [
      { title: 'Laurent & Associés enters Gulf luxury market with €30M fund', source: 'Les Echos', date: '2025-10-01' },
      { title: 'Speaker at MIPIM Cannes: European investors in the Gulf', source: 'MIPIM', date: '2025-03-15' },
    ],
    mediaReporting: [
      { headline: 'French luxury investors discover Dubai\'s tax-free advantage', outlet: 'Le Figaro Immobilier', date: '2025-11-22', sentiment: 'positive' },
      { headline: 'European family relocations to Dubai surge 45% in 2025', outlet: 'Arabian Business', date: '2025-10-28', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/sophielaurent-paris',
    linkedinHeadline: 'Partner at Laurent & Associés | Luxury Real Estate | International Investment',
    estimatedNetWorth: '€20M - €35M',
    phoneVerified: true,
    phoneCarrier: 'Orange France',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'parisprop.fr (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Laurent & Associés', role: 'Partner & Co-Founder', period: '2016 - Present', current: true },
      { company: 'BNP Paribas Real Estate', role: 'Director, Luxury Residential', period: '2011 - 2016', current: false },
      { company: 'Rothschild & Co (Paris)', role: 'Analyst, Real Estate Finance', period: '2008 - 2011', current: false },
    ],
    educationHistory: [
      { institution: 'HEC Paris', degree: 'MBA', field: 'Finance & Strategy', year: '2008' },
      { institution: 'Sciences Po Paris', degree: 'MA', field: 'Economics', year: '2005' },
    ],
  },
  'sb-lead-005': {
    overview: 'Chen Wei is a Shanghai-based investor primarily interested in Golden Visa eligible properties in the UAE. His family\'s venture capital firm has been expanding into international real estate as a diversification strategy. With a $750K+ budget and 3-month timeline, he represents a qualified lead with clear investment objectives.',
    occupation: 'Investment Director, Shanghai VC Partners',
    estimatedIncome: '¥3,000,000 - 5,000,000 p.a.',
    address: 'Tower 1, Lujiazui Financial Center, Pudong, Shanghai, China',
    companyAssociations: [
      { name: 'Shanghai VC Partners', role: 'Investment Director', sector: 'Venture Capital' },
      { name: 'China-UAE Investment Forum', role: 'Member', sector: 'Investment Network' },
    ],
    prNewsAchievements: [
      { title: 'Shanghai VC Partners allocates $30M to international real estate', source: 'Caixin Global', date: '2025-08-15' },
    ],
    mediaReporting: [
      { headline: 'Chinese investors target Dubai Golden Visa properties', outlet: 'South China Morning Post', date: '2025-10-25', sentiment: 'positive' },
      { headline: 'UAE Golden Visa drives surge in Asian property investment', outlet: 'Gulf News', date: '2025-09-18', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/chenwei-shanghai',
    linkedinHeadline: 'Investment Director at Shanghai VC Partners | Real Estate | Golden Visa',
    estimatedNetWorth: '$8M - $12M',
    phoneVerified: true,
    phoneCarrier: 'China Mobile',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'shanghaivc.cn (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Shanghai VC Partners', role: 'Investment Director', period: '2020 - Present', current: true },
      { company: 'CITIC Securities', role: 'Senior Analyst, Real Estate', period: '2016 - 2020', current: false },
      { company: 'Deloitte China', role: 'Manager, Transaction Advisory', period: '2013 - 2016', current: false },
    ],
    educationHistory: [
      { institution: 'Fudan University', degree: 'MBA', field: 'Finance & Investment', year: '2013' },
      { institution: 'Tsinghua University', degree: 'BSc', field: 'Economics', year: '2010' },
    ],
  },
  'sb-lead-006': {
    overview: 'James Mitchell is a New York-based real estate professional exploring the Dubai market for the first time. As a Senior VP at NYC Realty Corp, he has deep experience in US residential markets but is new to international property investment. His interest in JBR Waterfront and mortgage options suggests a considered, research-driven approach.',
    occupation: 'Senior VP, NYC Realty Corp',
    estimatedIncome: '$280,000 - $400,000 p.a.',
    address: '425 Park Avenue, Apt 32F, New York, NY 10022',
    companyAssociations: [
      { name: 'NYC Realty Corp', role: 'Senior Vice President', sector: 'Real Estate Investment' },
      { name: 'National Association of Realtors', role: 'Member', sector: 'Industry Body' },
    ],
    prNewsAchievements: [
      { title: 'NYC Realty Corp explores international diversification strategy', source: 'The Real Deal', date: '2025-09-08' },
    ],
    mediaReporting: [
      { headline: 'US investors eye Dubai as alternative to overpriced domestic market', outlet: 'Bloomberg', date: '2025-10-15', sentiment: 'neutral' },
    ],
    linkedinUrl: 'https://linkedin.com/in/jamesmitchell-nyc',
    linkedinHeadline: 'SVP at NYC Realty Corp | Real Estate | Investment Management',
    estimatedNetWorth: '$5M - $8M',
    phoneVerified: true,
    phoneCarrier: 'Verizon',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'nycrealty.com (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'NYC Realty Corp', role: 'Senior Vice President', period: '2019 - Present', current: true },
      { company: 'Cushman & Wakefield', role: 'Vice President, Residential', period: '2015 - 2019', current: false },
      { company: 'Morgan Stanley (NYC)', role: 'Associate, Real Estate Banking', period: '2012 - 2015', current: false },
    ],
    educationHistory: [
      { institution: 'Columbia Business School', degree: 'MBA', field: 'Real Estate Finance', year: '2012' },
      { institution: 'NYU Stern', degree: 'BSc', field: 'Finance', year: '2009' },
    ],
  },
  'sb-lead-007': {
    overview: 'Fatima Al-Hashimi is a local UAE buyer upgrading from a Dubai Marina apartment to a Saadiyat Island villa. With AED 15M cash budget and a solicitor already appointed, she is one of the most advanced buyers in the pipeline. Her family owns several commercial properties across Abu Dhabi and she has deep local market knowledge.',
    occupation: 'Director, Al-Hashimi Properties',
    estimatedIncome: 'AED 4,000,000 - 6,000,000 p.a.',
    address: '15 Al Bateen, Abu Dhabi, UAE',
    companyAssociations: [
      { name: 'Al-Hashimi Properties', role: 'Director', sector: 'Real Estate Development' },
      { name: 'Abu Dhabi Chamber of Commerce', role: 'Member', sector: 'Trade Association' },
      { name: 'UAE Businesswomen Council', role: 'Executive Member', sector: 'Industry Network' },
    ],
    prNewsAchievements: [
      { title: 'Al-Hashimi Properties completes AED 200M commercial project in Abu Dhabi', source: 'Gulf News', date: '2025-10-05' },
      { title: 'Named in Arabian Business "Top 100 Arab Businesswomen"', source: 'Arabian Business', date: '2025-06-20' },
    ],
    mediaReporting: [
      { headline: 'Local UAE buyers drive Saadiyat Island luxury market', outlet: 'The National', date: '2025-11-28', sentiment: 'positive' },
      { headline: 'Abu Dhabi villa market sees 20% price increase in 2025', outlet: 'Arabian Business', date: '2025-10-22', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/fatimahashimi',
    linkedinHeadline: 'Director at Al-Hashimi Properties | Real Estate | Abu Dhabi',
    estimatedNetWorth: 'AED 60M - 90M ($16M - $25M)',
    phoneVerified: true,
    phoneCarrier: 'du',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'hashimi-inv.ae (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Al-Hashimi Properties', role: 'Director', period: '2017 - Present', current: true },
      { company: 'Aldar Properties', role: 'Senior Manager, Residential Sales', period: '2013 - 2017', current: false },
      { company: 'Jones Lang LaSalle (Abu Dhabi)', role: 'Associate, Capital Markets', period: '2010 - 2013', current: false },
    ],
    educationHistory: [
      { institution: 'Sorbonne University Abu Dhabi', degree: 'MBA', field: 'International Business', year: '2010' },
      { institution: 'Zayed University', degree: 'BSc', field: 'Business Administration', year: '2007' },
    ],
  },
  'sb-lead-008': {
    overview: 'Thomas Schneider represents a German family office looking to allocate $5M into Dubai real estate through bulk purchase of 3-4 units across developments. As Managing Partner at Schneider Kapital, he manages a €500M+ multi-asset portfolio. His methodical approach and interest in multiple units make him a high-value pipeline lead.',
    occupation: 'Managing Partner, Schneider Kapital',
    estimatedIncome: '€500,000 - 750,000 p.a.',
    address: 'Maximilianstraße 35, 80539 Munich, Germany',
    companyAssociations: [
      { name: 'Schneider Kapital GmbH', role: 'Managing Partner', sector: 'Family Office / Asset Management' },
      { name: 'German Property Federation (ZIA)', role: 'Member', sector: 'Industry Association' },
      { name: 'German-Emirati Joint Council', role: 'Member', sector: 'Trade Association' },
    ],
    prNewsAchievements: [
      { title: 'Schneider Kapital launches €50M MENA real estate allocation', source: 'Immobilien Zeitung', date: '2025-09-25' },
      { title: 'Speaker at Expo Real Munich: Investing in Gulf residential', source: 'Expo Real', date: '2025-10-09' },
    ],
    mediaReporting: [
      { headline: 'German family offices increase Gulf real estate allocations', outlet: 'Handelsblatt', date: '2025-11-12', sentiment: 'positive' },
      { headline: 'European institutional interest in Dubai property reaches record', outlet: 'React News', date: '2025-10-30', sentiment: 'neutral' },
    ],
    linkedinUrl: 'https://linkedin.com/in/thomasschneider-munich',
    linkedinHeadline: 'Managing Partner at Schneider Kapital | Family Office | Real Estate',
    estimatedNetWorth: '€30M - €50M (Family Office)',
    phoneVerified: true,
    phoneCarrier: 'Deutsche Telekom',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'schneider-kapital.de (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Schneider Kapital GmbH', role: 'Managing Partner', period: '2016 - Present', current: true },
      { company: 'Patrizia AG', role: 'Investment Director, International', period: '2012 - 2016', current: false },
      { company: 'Deutsche Bank (Frankfurt)', role: 'VP, Real Estate Finance', period: '2008 - 2012', current: false },
    ],
    educationHistory: [
      { institution: 'WHU Otto Beisheim School of Management', degree: 'MSc', field: 'Finance', year: '2008' },
      { institution: 'Ludwig Maximilian University of Munich', degree: 'BA', field: 'Economics', year: '2006' },
    ],
  },
}

function SubScoreBar({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const color = getNBScoreColor(score)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-white text-right max-w-[60%] truncate">{value || '-'}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, accentColor }: { title: string; icon: any; children: React.ReactNode; accentColor?: string }) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentColor || 'text-white/50'}`} />
          {title}
        </h3>
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  )
}

function VerificationBadge({ verified, label }: { verified: boolean; label: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      verified
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>
      {verified ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
      {label}
    </div>
  )
}

function TimelineItem({ title, subtitle, period, current }: { title: string; subtitle: string; period: string; current: boolean }) {
  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${current ? 'bg-emerald-400' : 'bg-white/20'}`} />
        <div className="w-px flex-1 bg-white/10 mt-1" />
      </div>
      <div className="pb-4 flex-1">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-white/50">{subtitle}</p>
        <p className="text-xs text-white/30 mt-0.5">{period}</p>
      </div>
    </div>
  )
}

export default function SBDemoBuyerDetailPage() {
  const params = useParams()

  const lead = useMemo(() => {
    return SB_DEMO_RECENT_LEADS.find((l) => l.id === params.id)
  }, [params.id])

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/sbricksdemo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Buyers
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl py-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Buyer not found</h3>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const intel = BUYER_INTELLIGENCE[lead.id]
  const nbScore = lead.final_score || lead.ai_quality_score || 0
  const classification = lead.ai_classification || 'Cold'
  const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']
  const confidencePercent = (lead.ai_confidence || 0) <= 1 ? Math.round((lead.ai_confidence || 0) * 100) : Math.round((lead.ai_confidence || 0) * 10)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  const getNextAction = () => {
    switch (lead.status) {
      case 'Contact Pending': return 'Make initial contact via phone or WhatsApp. Verify identity and confirm interest.'
      case 'Follow Up': return 'Follow up on previous conversation. Share development brochure and schedule a viewing.'
      case 'Viewing Booked': return 'Confirm viewing appointment. Prepare property details and pricing information.'
      case 'Negotiating': return 'Follow up on offer status. Discuss pricing flexibility and completion timeline.'
      default: return 'Contact this lead to confirm interest and timeline.'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/sbricksdemo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Buyers
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {lead.full_name}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/50 mt-1">
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {lead.phone}
              </span>
            )}
            {intel && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" /> {intel.occupation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* NB Score Hero */}
      <div className={`border ${classConfig.ringBg} bg-[#111111] rounded-xl`}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex flex-col items-center flex-shrink-0">
              <NBScoreRing score={nbScore} size={120} strokeWidth={10} label="NB Score" />
            </div>
            <div className="flex-1 space-y-5 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${classConfig.bg} ${classConfig.text} text-base px-4 py-1.5`}>
                  {classConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                  <TrendingUp className="w-3 h-3 mr-1" /> High conversion probability
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SubScoreBar label="Quality" score={lead.ai_quality_score || 0} />
                <SubScoreBar label="Intent" score={lead.ai_intent_score || 0} />
                <SubScoreBar label="Confidence" score={confidencePercent} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Summary */}
      {intel && (
        <div className="bg-[#111111] border border-purple-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-purple-400 mb-1">Overview Summary</h4>
                <p className="text-sm text-white/70 leading-relaxed">{intel.overview}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {lead.ai_summary && (
        <div className="bg-[#111111] border border-blue-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-1">AI Summary</h4>
                <p className="text-sm text-white/70 leading-relaxed">{lead.ai_summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Next Action */}
      <div className="bg-[#111111] border border-emerald-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Recommended Next Action</h4>
              <p className="text-sm text-white/60 mb-3">{getNextAction()}</p>
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <Mail className="w-4 h-4 mr-1" /> Send Email
                  </Button>
                )}
                {lead.phone && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify This Buyer */}
      <div className="bg-[#111111] border border-amber-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Verify This Buyer</h4>
              <p className="text-sm text-white/60 mb-3">Complete KYC, AML and Proof of Funds checks via our integrated verification partner.</p>
              <div className="flex gap-2 flex-wrap">
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Run KYC / AML Check
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    <DollarSign className="w-4 h-4 mr-1" /> Proof of Funds
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
              </div>
              <p className="text-[10px] text-white/30 mt-2">Powered by Checkboard — KYC, AML & Source of Funds verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Checks */}
      {intel && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/50" />
                <span className="text-sm font-medium text-white">Phone Number Check</span>
              </div>
              <VerificationBadge verified={intel.phoneVerified} label={intel.phoneVerified ? 'Verified' : 'Unverified'} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Number</span>
                <span className="text-white/70">{lead.phone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Carrier</span>
                <span className="text-white/70">{intel.phoneCarrier}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Type</span>
                <span className="text-white/70">{intel.phoneType}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/50" />
                <span className="text-sm font-medium text-white">Email Check</span>
              </div>
              <VerificationBadge verified={intel.emailVerified} label={intel.emailVerified ? 'Verified' : 'Unverified'} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Email</span>
                <span className="text-white/70">{lead.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Domain</span>
                <span className="text-white/70">{intel.emailDomain}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Type</span>
                <span className="text-white/70">{intel.emailType}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Personal & Professional Info */}
          {intel && (
            <SectionCard title="Personal & Professional" icon={User} accentColor="text-blue-400">
              <div className="space-y-0">
                <DataRow label="Occupation" value={intel.occupation} icon={Briefcase} />
                <DataRow label="Estimated Income" value={intel.estimatedIncome} icon={DollarSign} />
                <DataRow label="Address" value={intel.address} icon={MapPin} />
                <DataRow label="Estimated Net Worth" value={intel.estimatedNetWorth} icon={DollarSign} />
                <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-sm text-white/50 flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </span>
                  <div className="text-right max-w-[60%]">
                    <p className="text-sm font-medium text-blue-400 truncate">{intel.linkedinHeadline}</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Status */}
          <SectionCard title="Status" icon={CircleDot}>
            <div className="grid grid-cols-2 gap-2">
              {['Contact Pending', 'Follow Up', 'Viewing Booked', 'Negotiating', 'Reserved', 'Exchanged', 'Completed', 'Not Proceeding'].map((status) => (
                <Button
                  key={status}
                  variant={lead.status === status ? 'default' : 'outline'}
                  size="sm"
                  className={`justify-start ${lead.status !== status ? 'border-white/10 text-white/60 hover:bg-white/5' : ''}`}
                >
                  {lead.status === status && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status}
                </Button>
              ))}
            </div>
          </SectionCard>

          {/* Company Associations */}
          {intel && (
            <SectionCard title="Company Associations" icon={Building} accentColor="text-amber-400">
              <div className="space-y-3">
                {intel.companyAssociations.map((company, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-sm font-medium text-white">{company.name}</p>
                    <p className="text-xs text-white/50 mt-0.5">{company.role}</p>
                    <Badge variant="outline" className="mt-1.5 text-[10px] border-white/10 text-white/40">{company.sector}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Work History */}
          {intel && (
            <SectionCard title="Work History" icon={Briefcase} accentColor="text-cyan-400">
              <div className="mt-1">
                {intel.workHistory.map((job, i) => (
                  <TimelineItem
                    key={i}
                    title={job.role}
                    subtitle={job.company}
                    period={job.period}
                    current={job.current}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Education History */}
          {intel && (
            <SectionCard title="Education History" icon={GraduationCap} accentColor="text-indigo-400">
              <div className="mt-1">
                {intel.educationHistory.map((edu, i) => (
                  <TimelineItem
                    key={i}
                    title={`${edu.degree} — ${edu.field}`}
                    subtitle={edu.institution}
                    period={edu.year}
                    current={false}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Notes */}
          <SectionCard title="Notes" icon={FileText}>
            <div className="bg-white/5 rounded-lg p-3 min-h-[80px]">
              <p className="text-sm text-white/40 italic">Click to add notes about this buyer...</p>
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Contact */}
          <SectionCard title="Contact Information" icon={User}>
            <div className="space-y-0">
              <DataRow label="Name" value={lead.full_name} icon={User} />
              <DataRow label="Email" value={lead.email} icon={Mail} />
              <DataRow label="Phone" value={lead.phone} icon={Phone} />
            </div>
          </SectionCard>

          {/* Property Requirements */}
          <SectionCard title="Property Requirements" icon={Building}>
            <div className="space-y-0">
              <DataRow label="Budget" value={lead.budget_range} icon={DollarSign} />
              <DataRow label="Development" value={lead.development_name} icon={Building} />
              <DataRow label="Source" value={lead.source_platform} icon={MapPin} />
            </div>
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Timeline" icon={Clock}>
            <div className="space-y-0">
              <DataRow label="Date Added" value={formatDate(lead.created_at)} icon={Calendar} />
              <DataRow label="Status" value={lead.status} />
              <DataRow label="Source" value={lead.source_platform} />
            </div>
          </SectionCard>

          {/* PR / News / Achievements */}
          {intel && (
            <SectionCard title="PR / News / Achievements" icon={Award} accentColor="text-yellow-400">
              <div className="space-y-3">
                {intel.prNewsAchievements.map((item, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-sm text-white leading-snug">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-white/40">{item.source}</span>
                      <span className="text-[10px] text-white/30">•</span>
                      <span className="text-[10px] text-white/30">{formatShortDate(item.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Media Reporting */}
          {intel && (
            <SectionCard title="Media Reporting" icon={Newspaper} accentColor="text-orange-400">
              <div className="space-y-3">
                {intel.mediaReporting.map((item, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white leading-snug flex-1">{item.headline}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] flex-shrink-0 ${
                          item.sentiment === 'positive'
                            ? 'border-emerald-500/30 text-emerald-400'
                            : item.sentiment === 'negative'
                            ? 'border-red-500/30 text-red-400'
                            : 'border-white/20 text-white/50'
                        }`}
                      >
                        {item.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-white/40">{item.outlet}</span>
                      <span className="text-[10px] text-white/30">•</span>
                      <span className="text-[10px] text-white/30">{formatShortDate(item.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
