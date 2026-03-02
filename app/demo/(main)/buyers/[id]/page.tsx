'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { DEMO_RECENT_LEADS } from '@/lib/demo-data'
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
  'demo-lead-001': {
    overview: 'James Richardson is a seasoned investment professional with over 15 years of experience in real estate and private equity. Based in Central London, he has a strong track record of high-value property acquisitions across prime locations. His verified cash position and existing solicitor engagement indicate a serious, ready-to-transact buyer with deep market knowledge.',
    occupation: 'Managing Director, Real Estate Investments',
    estimatedIncome: '£450,000 - £600,000 p.a.',
    address: '14 Eaton Square, Belgravia, London SW1W 9DD',
    companyAssociations: [
      { name: 'Meridian Investments Ltd', role: 'Managing Director', sector: 'Private Equity / Real Estate' },
      { name: 'London Property Circle', role: 'Board Member', sector: 'Industry Association' },
      { name: 'Canary Wharf Group (Advisory)', role: 'External Advisor', sector: 'Property Development' },
    ],
    prNewsAchievements: [
      { title: 'Named in Property Week\'s "Top 40 Under 40" dealmakers', source: 'Property Week', date: '2025-11-15' },
      { title: 'Meridian Investments closes £180M residential fund', source: 'CoStar News', date: '2025-09-22' },
      { title: 'Speaker at MIPIM London: "The Future of Prime Residential"', source: 'MIPIM', date: '2025-10-08' },
    ],
    mediaReporting: [
      { headline: 'Meridian Investments expands London residential portfolio', outlet: 'Financial Times', date: '2025-12-01', sentiment: 'positive' },
      { headline: 'Interview: Why smart money is moving to East London', outlet: 'Evening Standard', date: '2025-10-15', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/jamesrichardson',
    linkedinHeadline: 'MD at Meridian Investments | Real Estate | Private Equity',
    estimatedNetWorth: '£8M - £12M',
    phoneVerified: true,
    phoneCarrier: 'EE Business',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'meridian-inv.com (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Meridian Investments Ltd', role: 'Managing Director', period: '2019 - Present', current: true },
      { company: 'Knight Frank', role: 'Associate Director, Capital Markets', period: '2014 - 2019', current: false },
      { company: 'CBRE', role: 'Senior Analyst, Residential', period: '2011 - 2014', current: false },
    ],
    educationHistory: [
      { institution: 'London School of Economics', degree: 'MSc', field: 'Real Estate Economics & Finance', year: '2011' },
      { institution: 'University of Cambridge', degree: 'BA (Hons)', field: 'Land Economy', year: '2009' },
    ],
  },
  'demo-lead-002': {
    overview: 'Sarah Chen is a prominent Hong Kong-based property investor with an established portfolio across Asia-Pacific and European markets. Her family office manages significant real estate holdings and she has been actively expanding into the London market over the past 3 years. Proof of funds verified through HSBC Private Banking, indicating substantial liquidity for immediate transactions.',
    occupation: 'Director, Chen Family Office',
    estimatedIncome: '£800,000 - £1,200,000 p.a.',
    address: 'Unit 3801, The Harbourside, Kowloon Station, Hong Kong',
    companyAssociations: [
      { name: 'Chen Family Office', role: 'Director', sector: 'Family Office / Wealth Management' },
      { name: 'Asia-Pacific Property Holdings', role: 'Non-Executive Director', sector: 'Real Estate Investment' },
      { name: 'Hong Kong Real Estate Investors Association', role: 'Member', sector: 'Industry Association' },
    ],
    prNewsAchievements: [
      { title: 'Chen Family Office expands European real estate allocation to 30%', source: 'South China Morning Post', date: '2025-08-20' },
      { title: 'Featured in Forbes Asia "Next Gen Leaders in Property"', source: 'Forbes Asia', date: '2025-06-10' },
    ],
    mediaReporting: [
      { headline: 'HK investors return to London property market amid rate cuts', outlet: 'South China Morning Post', date: '2025-11-12', sentiment: 'positive' },
      { headline: 'Asian family offices increase London allocations', outlet: 'Bloomberg', date: '2025-10-03', sentiment: 'neutral' },
    ],
    linkedinUrl: 'https://linkedin.com/in/sarahchenHK',
    linkedinHeadline: 'Director at Chen Family Office | Real Estate | Cross-border Investment',
    estimatedNetWorth: '£25M - £40M (Family Office)',
    phoneVerified: true,
    phoneCarrier: 'PCCW-HKT',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'hkmail.com (Personal)',
    emailType: 'Personal',
    workHistory: [
      { company: 'Chen Family Office', role: 'Director', period: '2020 - Present', current: true },
      { company: 'Goldman Sachs (Hong Kong)', role: 'Vice President, Real Estate', period: '2016 - 2020', current: false },
      { company: 'JLL Hong Kong', role: 'Associate, Capital Markets', period: '2013 - 2016', current: false },
    ],
    educationHistory: [
      { institution: 'University of Hong Kong', degree: 'MBA', field: 'Finance & Strategy', year: '2013' },
      { institution: 'Imperial College London', degree: 'BSc', field: 'Mathematics', year: '2010' },
    ],
  },
  'demo-lead-003': {
    overview: 'Mohammed Al-Rashid is a Dubai-based investor and CEO of Rashid Holdings, a diversified conglomerate with interests in real estate, hospitality, and technology. He has a dependent studying at UCL and is seeking a premium Central London residence. His verified fund position of £6M+ through Emirates NBD Private Banking confirms he is a serious ultra-high-net-worth buyer with immediate purchasing capacity.',
    occupation: 'CEO, Rashid Holdings',
    estimatedIncome: '£1,500,000 - £2,500,000 p.a.',
    address: 'Villa 17, Emirates Hills, Dubai, UAE',
    companyAssociations: [
      { name: 'Rashid Holdings', role: 'CEO & Founder', sector: 'Conglomerate / Investments' },
      { name: 'Dubai Land Department', role: 'Advisory Council Member', sector: 'Government / Real Estate' },
      { name: 'UCL Qatari & Emirati Society', role: 'Parent Patron', sector: 'Education / Social' },
    ],
    prNewsAchievements: [
      { title: 'Rashid Holdings announces £200M UK investment programme', source: 'Arabian Business', date: '2025-09-30' },
      { title: 'Named in Gulf Business "Top 100 MENA Entrepreneurs"', source: 'Gulf Business', date: '2025-07-15' },
      { title: 'Keynote at Arabian Property Awards 2025', source: 'Arabian Property Awards', date: '2025-11-02' },
    ],
    mediaReporting: [
      { headline: 'UAE investors drive surge in London prime property deals', outlet: 'The National', date: '2025-12-05', sentiment: 'positive' },
      { headline: 'Rashid Holdings diversifies into UK residential', outlet: 'Arabian Business', date: '2025-10-01', sentiment: 'positive' },
      { headline: 'Gulf capital flows into London real estate reach 5-year high', outlet: 'Financial Times', date: '2025-11-20', sentiment: 'neutral' },
    ],
    linkedinUrl: 'https://linkedin.com/in/mohammedalrashid',
    linkedinHeadline: 'CEO at Rashid Holdings | Real Estate | Technology | Hospitality',
    estimatedNetWorth: '£50M - £80M',
    phoneVerified: true,
    phoneCarrier: 'Etisalat',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'rashid-holdings.ae (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Rashid Holdings', role: 'CEO & Founder', period: '2012 - Present', current: true },
      { company: 'Emaar Properties', role: 'Director of Investments', period: '2008 - 2012', current: false },
      { company: 'McKinsey & Company (Dubai)', role: 'Engagement Manager', period: '2005 - 2008', current: false },
    ],
    educationHistory: [
      { institution: 'INSEAD', degree: 'MBA', field: 'Strategy & Finance', year: '2005' },
      { institution: 'American University of Sharjah', degree: 'BSc', field: 'Civil Engineering', year: '2002' },
    ],
  },
  'demo-lead-004': {
    overview: 'Emily Thornton is a London-based financial services professional seeking her primary residence. As a Senior Director at Deloitte, she has strong, verifiable income and an established mortgage Agreement in Principle of £1.8M. She has already instructed solicitors and submitted an offer on a Dollar Bay 3-bedroom unit, placing her at the most advanced stage of any current buyer.',
    occupation: 'Senior Director, Financial Advisory',
    estimatedIncome: '£220,000 - £280,000 p.a.',
    address: '42 Clapham Common North Side, London SW4 0QR',
    companyAssociations: [
      { name: 'Deloitte LLP', role: 'Senior Director, Financial Advisory', sector: 'Professional Services' },
      { name: 'ICAEW', role: 'Fellow (FCA)', sector: 'Professional Body' },
    ],
    prNewsAchievements: [
      { title: 'Led Deloitte\'s advisory on £2.5B housing association merger', source: 'Accountancy Age', date: '2025-10-18' },
      { title: 'Speaker at Women in Finance Charter Annual Summit', source: 'Women in Finance', date: '2025-09-05' },
    ],
    mediaReporting: [
      { headline: 'Deloitte expands UK real estate advisory practice', outlet: 'Property Week', date: '2025-11-08', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/emilythornton',
    linkedinHeadline: 'Senior Director at Deloitte | Financial Advisory | Real Estate',
    estimatedNetWorth: '£3M - £5M',
    phoneVerified: true,
    phoneCarrier: 'Vodafone UK',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'gmail.com (Personal)',
    emailType: 'Personal',
    workHistory: [
      { company: 'Deloitte LLP', role: 'Senior Director, Financial Advisory', period: '2020 - Present', current: true },
      { company: 'Deloitte LLP', role: 'Director, Real Estate Advisory', period: '2017 - 2020', current: false },
      { company: 'PwC', role: 'Senior Manager, Deals', period: '2013 - 2017', current: false },
      { company: 'Ernst & Young', role: 'Manager, Transaction Advisory', period: '2010 - 2013', current: false },
    ],
    educationHistory: [
      { institution: 'University of Oxford', degree: 'MA (Hons)', field: 'Philosophy, Politics & Economics', year: '2008' },
      { institution: 'ACA Qualification', degree: 'ACA / FCA', field: 'Chartered Accountancy', year: '2011' },
    ],
  },
  'demo-lead-005': {
    overview: 'Michael Okonkwo is a Lagos-based venture capitalist and serial entrepreneur with an established UK property portfolio of 3 existing properties. He is a cash buyer looking for a new-build buy-to-let investment in East London. His existing UK property experience and cash position make him a knowledgeable and decisive buyer with a clear investment thesis.',
    occupation: 'Managing Partner, Lagos Ventures',
    estimatedIncome: '£600,000 - £900,000 p.a.',
    address: '8 Banana Island Road, Ikoyi, Lagos, Nigeria',
    companyAssociations: [
      { name: 'Lagos Ventures', role: 'Managing Partner & Co-Founder', sector: 'Venture Capital' },
      { name: 'Nigerian-British Chamber of Commerce', role: 'Council Member', sector: 'Trade Association' },
      { name: 'Okonkwo Property Holdings (UK)', role: 'Director', sector: 'Real Estate Investment' },
    ],
    prNewsAchievements: [
      { title: 'Lagos Ventures raises $50M Fund III targeting proptech', source: 'TechCrunch Africa', date: '2025-08-12' },
      { title: 'Named in BusinessDay "Top 50 Nigerian Investors"', source: 'BusinessDay', date: '2025-06-20' },
    ],
    mediaReporting: [
      { headline: 'Nigerian investors increasingly target London new-builds', outlet: 'Savills Research', date: '2025-10-22', sentiment: 'positive' },
      { headline: 'West African capital flows into UK property surge 40% YoY', outlet: 'Property Investor Today', date: '2025-09-15', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/michaelokonkwo',
    linkedinHeadline: 'Managing Partner at Lagos Ventures | VC | PropTech | Real Estate',
    estimatedNetWorth: '£15M - £22M',
    phoneVerified: true,
    phoneCarrier: 'MTN Nigeria',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'lagosventures.ng (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Lagos Ventures', role: 'Managing Partner', period: '2018 - Present', current: true },
      { company: 'Okonkwo Property Holdings', role: 'Director', period: '2016 - Present', current: true },
      { company: 'Goldman Sachs (London)', role: 'Associate, Investment Banking', period: '2012 - 2016', current: false },
    ],
    educationHistory: [
      { institution: 'London Business School', degree: 'MBA', field: 'Finance & Entrepreneurship', year: '2012' },
      { institution: 'University of Lagos', degree: 'BSc (First Class)', field: 'Economics', year: '2009' },
    ],
  },
  'demo-lead-006': {
    overview: 'Alexandra Muller is a Berlin-based real estate investor with a focus on prime European residential markets. She runs Berlin Property GmbH, a mid-size investment firm managing €200M+ in residential assets across Germany and the UK. Her proof of funds has been verified at £3.2M through Deutsche Bank Private, and she has already engaged a UK solicitor — indicating strong purchasing intent.',
    occupation: 'Managing Director, Berlin Property GmbH',
    estimatedIncome: '£350,000 - £500,000 p.a.',
    address: 'Kurfürstendamm 195, 10707 Berlin, Germany',
    companyAssociations: [
      { name: 'Berlin Property GmbH', role: 'Managing Director & Founder', sector: 'Real Estate Investment' },
      { name: 'German Property Federation (ZIA)', role: 'Member', sector: 'Industry Association' },
      { name: 'Anglo-German Real Estate Forum', role: 'Co-Chair', sector: 'Industry Network' },
    ],
    prNewsAchievements: [
      { title: 'Berlin Property GmbH expands UK portfolio to £120M', source: 'Immobilien Zeitung', date: '2025-10-05' },
      { title: 'Speaker at Expo Real Munich: Cross-border residential investing', source: 'Expo Real', date: '2025-10-09' },
    ],
    mediaReporting: [
      { headline: 'German investors see opportunity in London post-rate cuts', outlet: 'Handelsblatt', date: '2025-11-18', sentiment: 'positive' },
      { headline: 'European cross-border property deals hit record in 2025', outlet: 'React News', date: '2025-12-02', sentiment: 'neutral' },
    ],
    linkedinUrl: 'https://linkedin.com/in/alexandramuller',
    linkedinHeadline: 'MD at Berlin Property GmbH | Cross-border Real Estate | Investment',
    estimatedNetWorth: '£10M - £18M',
    phoneVerified: true,
    phoneCarrier: 'Deutsche Telekom',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'berlinprop.de (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Berlin Property GmbH', role: 'Managing Director & Founder', period: '2017 - Present', current: true },
      { company: 'Patrizia AG', role: 'Investment Manager, UK Residential', period: '2013 - 2017', current: false },
      { company: 'Deutsche Bank (London)', role: 'Real Estate Analyst', period: '2010 - 2013', current: false },
    ],
    educationHistory: [
      { institution: 'WHU Otto Beisheim School of Management', degree: 'MSc', field: 'Finance', year: '2010' },
      { institution: 'Freie Universität Berlin', degree: 'BA', field: 'Business Administration', year: '2008' },
    ],
  },
  'demo-lead-007': {
    overview: 'Priya Sharma is a Mumbai-based investor with a daughter starting at King\'s College London. She is looking for a 2-bedroom property near Waterloo as both a student accommodation and long-term investment. While her £1.5M budget is at the lower end for Keybridge Lofts, her family\'s business background and intent to purchase within 3 months make her a strong qualified lead.',
    occupation: 'Director, Sharma Group of Companies',
    estimatedIncome: '£300,000 - £450,000 p.a.',
    address: 'Sharma House, Breach Candy, Mumbai 400026, India',
    companyAssociations: [
      { name: 'Sharma Group of Companies', role: 'Director', sector: 'Diversified Conglomerate' },
      { name: 'Mumbai Property Developers Association', role: 'Member', sector: 'Industry Body' },
    ],
    prNewsAchievements: [
      { title: 'Sharma Group diversifies into international real estate', source: 'Economic Times', date: '2025-07-28' },
    ],
    mediaReporting: [
      { headline: 'Indian HNWI investment in London residential rises 25%', outlet: 'Knight Frank Research', date: '2025-09-10', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/priyasharma-mumbai',
    linkedinHeadline: 'Director at Sharma Group | Real Estate | Investment | Education',
    estimatedNetWorth: '£8M - £15M (Family)',
    phoneVerified: true,
    phoneCarrier: 'Jio',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'mumbai-group.in (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Sharma Group of Companies', role: 'Director', period: '2018 - Present', current: true },
      { company: 'HDFC Ltd', role: 'Senior Manager, Corporate Finance', period: '2014 - 2018', current: false },
      { company: 'KPMG India', role: 'Manager, Advisory', period: '2011 - 2014', current: false },
    ],
    educationHistory: [
      { institution: 'Indian Institute of Management, Ahmedabad', degree: 'MBA (PGDM)', field: 'Finance', year: '2011' },
      { institution: 'University of Mumbai', degree: 'BCom (Hons)', field: 'Accounting & Finance', year: '2008' },
    ],
  },
  'demo-lead-008': {
    overview: 'David Osei is an Accra-based property developer and investor exploring off-plan opportunities at Royal Eden Docks. With a budget of £750K and a 6-month timeline, he is currently exploring mortgage options for UK purchase. His existing experience in Ghanaian property development gives him good market understanding, though his financing timeline makes him a mid-priority qualified lead.',
    occupation: 'CEO, Accra Development Company',
    estimatedIncome: '£150,000 - £250,000 p.a.',
    address: '22 Liberation Road, Airport Residential Area, Accra, Ghana',
    companyAssociations: [
      { name: 'Accra Development Company', role: 'CEO & Founder', sector: 'Property Development' },
      { name: 'Ghana Real Estate Developers Association', role: 'Member', sector: 'Industry Body' },
    ],
    prNewsAchievements: [
      { title: 'Accra Dev Co completes 200-unit residential project in East Legon', source: 'Ghana Business News', date: '2025-05-15' },
    ],
    mediaReporting: [
      { headline: 'Ghanaian diaspora and investors look to London property', outlet: 'African Property Magazine', date: '2025-08-20', sentiment: 'positive' },
    ],
    linkedinUrl: 'https://linkedin.com/in/davidosei-accra',
    linkedinHeadline: 'CEO at Accra Development Co | Property Development | Real Estate',
    estimatedNetWorth: '£4M - £7M',
    phoneVerified: true,
    phoneCarrier: 'MTN Ghana',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'accradev.gh (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Accra Development Company', role: 'CEO & Founder', period: '2015 - Present', current: true },
      { company: 'Broll Ghana', role: 'Property Manager', period: '2011 - 2015', current: false },
      { company: 'Barclays Bank Ghana', role: 'Relationship Manager', period: '2008 - 2011', current: false },
    ],
    educationHistory: [
      { institution: 'University of Ghana, Legon', degree: 'MBA', field: 'Real Estate & Construction', year: '2011' },
      { institution: 'Kwame Nkrumah University of Science & Technology', degree: 'BSc', field: 'Building Technology', year: '2007' },
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

export default function DemoBuyerDetailPage() {
  const params = useParams()

  const lead = useMemo(() => {
    return DEMO_RECENT_LEADS.find((l) => l.id === params.id)
  }, [params.id])

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/demo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white">
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
          <Link href="/demo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
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
