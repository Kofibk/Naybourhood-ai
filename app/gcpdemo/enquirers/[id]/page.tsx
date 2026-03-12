'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { ALL_ENQUIRERS, getConversationForEnquirer } from '@/lib/gcpdemo'
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
  CheckCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Linkedin,
  Briefcase,
  GraduationCap,
  FileText,
  Search,
  BadgeCheck,
  CircleDot,
  Home,
  UserCheck,
  MessageSquare,
} from 'lucide-react'

// Tenant intelligence data keyed by enquirer ID
const TENANT_INTELLIGENCE: Record<string, {
  overview: string
  occupation: string
  estimatedIncome: string
  currentAddress: string
  companyAssociations: { name: string; role: string; sector: string }[]
  references: { type: string; provider: string; status: 'verified' | 'pending' | 'failed'; detail: string }[]
  linkedinUrl: string
  linkedinHeadline: string
  creditScore: string
  phoneVerified: boolean
  phoneCarrier: string
  phoneType: string
  emailVerified: boolean
  emailDomain: string
  emailType: string
  workHistory: { company: string; role: string; period: string; current: boolean }[]
  educationHistory: { institution: string; degree: string; field: string; year: string }[]
  rightToRent: 'verified' | 'pending' | 'failed'
  previousLandlord: string
  tenancyLength: string
}> = {
  'enq-marcus-weber': {
    overview: 'Marcus Weber is a VP of Strategy at Deutsche Bank with 6 years tenure, verified via LinkedIn and Companies House. His £95,000 salary comfortably supports the £1,850 PCM rent (23% rent-to-income). Electoral roll confirms City of London address since 2021. Clean credit history, strong landlord reference from Grainger PLC.',
    occupation: 'VP Strategy, Deutsche Bank',
    estimatedIncome: '£95,000 p.a.',
    currentAddress: 'Flat 12, Bankside Lofts, 65 Hopton Street, London SE1 9JH',
    companyAssociations: [
      { name: 'Deutsche Bank', role: 'VP Strategy', sector: 'Banking / Financial Services' },
      { name: 'CFA Institute', role: 'Charterholder', sector: 'Professional Body' },
    ],
    references: [
      { type: 'Employer', provider: 'Deutsche Bank HR', status: 'verified', detail: 'Employment confirmed since 2019. VP level, permanent contract.' },
      { type: 'Landlord', provider: 'Grainger PLC', status: 'verified', detail: '3-year tenancy, no arrears, no damage, excellent tenant.' },
      { type: 'Credit Check', provider: 'Experian', status: 'verified', detail: 'Score 945/999. No CCJs, no defaults, clean record.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/marcusweber',
    linkedinHeadline: 'VP Strategy at Deutsche Bank | CFA Charterholder',
    creditScore: '945/999 (Excellent)',
    phoneVerified: true,
    phoneCarrier: 'EE Business',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'deutschebank.com (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Deutsche Bank', role: 'VP Strategy', period: '2019 - Present', current: true },
      { company: 'Deutsche Bank', role: 'Associate, Strategy', period: '2017 - 2019', current: false },
      { company: 'McKinsey & Company', role: 'Business Analyst', period: '2015 - 2017', current: false },
    ],
    educationHistory: [
      { institution: 'London School of Economics', degree: 'MSc', field: 'Finance', year: '2015' },
      { institution: 'University of Mannheim', degree: 'BSc', field: 'Business Administration', year: '2013' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'Grainger PLC — 3 year tenancy, excellent reference',
    tenancyLength: 'Seeking 12-month minimum',
  },
  'enq-amara-osei': {
    overview: 'Amara Osei is a Senior Consultant at Deloitte with a stable career trajectory and strong income. Her £78,000 salary supports the £2,200 PCM rent at 34% rent-to-income — slightly above comfort but within acceptable range. Employer reference verified, previous landlord reference from Foxtons confirms clean 2-year tenancy.',
    occupation: 'Senior Consultant, Deloitte',
    estimatedIncome: '£78,000 p.a.',
    currentAddress: '88 Brixton Road, London SW9 6BE',
    companyAssociations: [
      { name: 'Deloitte LLP', role: 'Senior Consultant', sector: 'Professional Services' },
      { name: 'ICAEW', role: 'Associate (ACA)', sector: 'Professional Body' },
    ],
    references: [
      { type: 'Employer', provider: 'Deloitte HR', status: 'verified', detail: 'Employment confirmed since 2021. Permanent contract, good standing.' },
      { type: 'Landlord', provider: 'Foxtons', status: 'verified', detail: '2-year tenancy in Brixton. No arrears, property returned in good condition.' },
      { type: 'Credit Check', provider: 'Experian', status: 'verified', detail: 'Score 870/999. Clean record, no adverse entries.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/amaraosei',
    linkedinHeadline: 'Senior Consultant at Deloitte | ACA Qualified',
    creditScore: '870/999 (Good)',
    phoneVerified: true,
    phoneCarrier: 'Vodafone UK',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'deloitte.co.uk (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Deloitte LLP', role: 'Senior Consultant', period: '2021 - Present', current: true },
      { company: 'Deloitte LLP', role: 'Consultant', period: '2019 - 2021', current: false },
      { company: 'Grant Thornton', role: 'Audit Associate', period: '2017 - 2019', current: false },
    ],
    educationHistory: [
      { institution: 'University of Warwick', degree: 'BSc', field: 'Accounting & Finance', year: '2017' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'Foxtons — 2 year tenancy, clean record',
    tenancyLength: 'Seeking 12-month minimum',
  },
  'enq-james-okafor': {
    overview: 'James Okafor is a Product Manager at Google with verified income of £105,000. His rent-to-income ratio of 25% is well within comfort range. However, he has only been in the UK for 18 months, limiting his UK credit history. Right to Rent verified via BRP. Strong employer reference from Google HR.',
    occupation: 'Product Manager, Google',
    estimatedIncome: '£105,000 p.a.',
    currentAddress: 'Flat 4, 22 Westferry Circus, Canary Wharf, London E14 8RR',
    companyAssociations: [
      { name: 'Google UK', role: 'Product Manager', sector: 'Technology' },
    ],
    references: [
      { type: 'Employer', provider: 'Google UK HR', status: 'verified', detail: 'Employment confirmed since 2024. L6 level, permanent contract.' },
      { type: 'Landlord', provider: 'Canary Wharf Estates', status: 'verified', detail: '18-month tenancy, no issues, deposit returned in full.' },
      { type: 'Credit Check', provider: 'Experian', status: 'pending', detail: 'Limited UK credit history (18 months). No adverse entries found.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/jamesokafor',
    linkedinHeadline: 'Product Manager at Google | Ex-Meta | Tech',
    creditScore: '720/999 (Fair — Limited UK history)',
    phoneVerified: true,
    phoneCarrier: 'Three UK',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'google.com (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Google UK', role: 'Product Manager', period: '2024 - Present', current: true },
      { company: 'Meta (Dublin)', role: 'Product Manager', period: '2021 - 2024', current: false },
      { company: 'Andela (Lagos)', role: 'Senior Product Analyst', period: '2019 - 2021', current: false },
    ],
    educationHistory: [
      { institution: 'Stanford University', degree: 'MS', field: 'Computer Science', year: '2019' },
      { institution: 'University of Lagos', degree: 'BSc', field: 'Electrical Engineering', year: '2016' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'Canary Wharf Estates — 18 months, clean',
    tenancyLength: 'Seeking 24-month tenancy',
  },
  'enq-sophie-chen': {
    overview: 'Sophie Chen is a Director of Asia Desk at HSBC with a strong £130,000 salary, giving an excellent 20% rent-to-income ratio. Electoral roll confirmed at current Chelsea address since 2020. Excellent credit score and a 4-year landlord reference from Savills. Premium tenant profile.',
    occupation: 'Director, Asia Desk, HSBC',
    estimatedIncome: '£130,000 p.a.',
    currentAddress: '7 Cheyne Walk, Chelsea, London SW3 5HL',
    companyAssociations: [
      { name: 'HSBC Holdings', role: 'Director, Asia Desk', sector: 'Banking / Financial Services' },
      { name: 'Asia House', role: 'Corporate Member', sector: 'Trade / Cultural Organisation' },
    ],
    references: [
      { type: 'Employer', provider: 'HSBC HR', status: 'verified', detail: 'Director level since 2022. 8 years with HSBC, permanent contract.' },
      { type: 'Landlord', provider: 'Savills Property Management', status: 'verified', detail: '4-year tenancy in Chelsea. Exemplary tenant, no issues whatsoever.' },
      { type: 'Credit Check', provider: 'Experian', status: 'verified', detail: 'Score 960/999. Excellent credit history, no adverse records.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/sophiechen-hsbc',
    linkedinHeadline: 'Director, Asia Desk at HSBC | Banking | Cross-border Finance',
    creditScore: '960/999 (Excellent)',
    phoneVerified: true,
    phoneCarrier: 'EE',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'hsbc.com (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'HSBC Holdings', role: 'Director, Asia Desk', period: '2022 - Present', current: true },
      { company: 'HSBC Holdings', role: 'VP, Asia Desk', period: '2019 - 2022', current: false },
      { company: 'Standard Chartered', role: 'Associate, Trade Finance', period: '2016 - 2019', current: false },
    ],
    educationHistory: [
      { institution: 'London Business School', degree: 'MBA', field: 'Finance', year: '2016' },
      { institution: 'Peking University', degree: 'BA', field: 'Economics', year: '2013' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'Savills — 4 year tenancy, exemplary',
    tenancyLength: 'Seeking 24-month tenancy',
  },
  'enq-tom-richards': {
    overview: 'Tom Richards presents as a freelance consultant claiming £60,000 income, but verification has flagged multiple inconsistencies. Companies House shows his listed company was dissolved 6 months ago. LinkedIn profile has limited connections and was recently created. Credit check reveals a CCJ from 2024. This is a high-risk applicant requiring caution.',
    occupation: 'Self-Employed Consultant (Unverified)',
    estimatedIncome: '£60,000 p.a. (Self-reported, Unverified)',
    currentAddress: '15 Camberwell Green, London SE5 7AF',
    companyAssociations: [
      { name: 'Richards Consulting Ltd (Dissolved)', role: 'Director', sector: 'Consulting' },
    ],
    references: [
      { type: 'Employer', provider: 'Self-employed — no employer ref', status: 'failed', detail: 'Unable to verify income. Company dissolved Dec 2024.' },
      { type: 'Landlord', provider: 'No reference provided', status: 'failed', detail: 'Applicant claims he was living with family. No landlord reference available.' },
      { type: 'Credit Check', provider: 'Experian', status: 'failed', detail: 'Score 410/999. 1 x CCJ (£3,200 — Apr 2024). 2 missed payments.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/tomrichards-consult',
    linkedinHeadline: 'Independent Consultant',
    creditScore: '410/999 (Poor — CCJ on record)',
    phoneVerified: true,
    phoneCarrier: 'Giffgaff',
    phoneType: 'Mobile',
    emailVerified: false,
    emailDomain: 'gmail.com (Personal)',
    emailType: 'Personal',
    workHistory: [
      { company: 'Richards Consulting Ltd (Dissolved)', role: 'Director', period: '2023 - 2024', current: false },
      { company: 'Unknown employer', role: 'Consultant', period: '2020 - 2023', current: false },
    ],
    educationHistory: [
      { institution: 'University of Brighton', degree: 'BA', field: 'Business Studies', year: '2018' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'No reference available',
    tenancyLength: 'Seeking 6-month tenancy',
  },
  'enq-elena-petrov': {
    overview: 'Elena Petrov is a Research Fellow at Imperial College with a stable academic career. Her £55,000 salary gives a 36% rent-to-income ratio — above the comfort zone but within warning range. Strong employer and character references. Clean credit history. She is relocating from Cambridge to be closer to her Imperial lab.',
    occupation: 'Research Fellow, Imperial College London',
    estimatedIncome: '£55,000 p.a.',
    currentAddress: '34 Mill Road, Cambridge CB1 2BD',
    companyAssociations: [
      { name: 'Imperial College London', role: 'Research Fellow, Bioengineering', sector: 'Higher Education / Research' },
      { name: 'Royal Society of Chemistry', role: 'Member (MRSC)', sector: 'Professional Body' },
    ],
    references: [
      { type: 'Employer', provider: 'Imperial College HR', status: 'verified', detail: 'Research Fellow since 2024. 3-year fixed-term contract.' },
      { type: 'Landlord', provider: 'Cambridge Lettings Agency', status: 'verified', detail: '2-year tenancy in Cambridge. Good tenant, minor cleaning charge at checkout.' },
      { type: 'Credit Check', provider: 'Experian', status: 'verified', detail: 'Score 810/999. Clean record, no adverse entries.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/elenapetrovic',
    linkedinHeadline: 'Research Fellow at Imperial College London | Bioengineering',
    creditScore: '810/999 (Good)',
    phoneVerified: true,
    phoneCarrier: 'O2',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'imperial.ac.uk (Institutional)',
    emailType: 'Institutional',
    workHistory: [
      { company: 'Imperial College London', role: 'Research Fellow', period: '2024 - Present', current: true },
      { company: 'University of Cambridge', role: 'Postdoctoral Researcher', period: '2021 - 2024', current: false },
      { company: 'Max Planck Institute', role: 'PhD Researcher', period: '2018 - 2021', current: false },
    ],
    educationHistory: [
      { institution: 'Max Planck Institute / ETH Zurich', degree: 'PhD', field: 'Bioengineering', year: '2021' },
      { institution: 'University of Belgrade', degree: 'MSc', field: 'Chemical Engineering', year: '2018' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'Cambridge Lettings Agency — 2 year tenancy',
    tenancyLength: 'Seeking 12-month minimum',
  },
  'enq-raj-kapoor': {
    overview: 'Raj Kapoor is a medical registrar at Imperial NHS Trust with a combined NHS income of £72,000. His rent-to-income ratio of 29% is within comfort range. NHS employment provides strong stability. Previous landlord confirms excellent tenancy. He is relocating from a shared house to a 1-bed closer to the hospital.',
    occupation: 'Medical Registrar, Imperial NHS Trust',
    estimatedIncome: '£72,000 p.a. (inc. NHS enhancements)',
    currentAddress: 'Room 12, Doctors Residence, Hammersmith Hospital, W12 0HS',
    companyAssociations: [
      { name: 'Imperial College Healthcare NHS Trust', role: 'ST5 Medical Registrar', sector: 'Healthcare / NHS' },
      { name: 'General Medical Council', role: 'Registered (Full)', sector: 'Medical Regulator' },
    ],
    references: [
      { type: 'Employer', provider: 'Imperial NHS Trust HR', status: 'verified', detail: 'ST5 Registrar since 2024. NHS permanent rotation track.' },
      { type: 'Landlord', provider: 'NHS Trust Accommodation', status: 'verified', detail: 'Hospital accommodation, no issues, clean record.' },
      { type: 'Credit Check', provider: 'Experian', status: 'verified', detail: 'Score 850/999. Clean record, NHS pension contributor.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/rajkapoor-nhs',
    linkedinHeadline: 'Medical Registrar at Imperial NHS | Cardiology',
    creditScore: '850/999 (Good)',
    phoneVerified: true,
    phoneCarrier: 'EE',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'nhs.net (Institutional)',
    emailType: 'Institutional',
    workHistory: [
      { company: 'Imperial College Healthcare NHS Trust', role: 'ST5 Medical Registrar', period: '2024 - Present', current: true },
      { company: "St Mary's Hospital", role: 'ST3-4 Medical Registrar', period: '2022 - 2024', current: false },
      { company: 'Royal Free Hospital', role: 'CT1-2 Core Trainee', period: '2020 - 2022', current: false },
    ],
    educationHistory: [
      { institution: 'University of Oxford', degree: 'MBBS', field: 'Medicine', year: '2020' },
      { institution: 'Imperial College London', degree: 'BSc', field: 'Biomedical Sciences', year: '2016' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'NHS Trust Accommodation — clean record',
    tenancyLength: 'Seeking 12-month tenancy',
  },
  'enq-li-mei-wong': {
    overview: 'Li Mei Wong is a Marketing Manager at Burberry with a solid £68,000 salary. Her 32% rent-to-income ratio is slightly above the comfort zone but acceptable. She has a strong 3-year tenancy reference from her current Notting Hill flat. She is relocating to be closer to Burberry HQ in Kensington.',
    occupation: 'Marketing Manager, Burberry',
    estimatedIncome: '£68,000 p.a.',
    currentAddress: '19 Portobello Road, Notting Hill, London W11 3DA',
    companyAssociations: [
      { name: 'Burberry Group PLC', role: 'Marketing Manager, Digital', sector: 'Luxury Fashion / Retail' },
    ],
    references: [
      { type: 'Employer', provider: 'Burberry HR', status: 'verified', detail: 'Marketing Manager since 2022. Permanent contract.' },
      { type: 'Landlord', provider: 'Chestertons', status: 'verified', detail: '3-year tenancy in Notting Hill. Excellent tenant.' },
      { type: 'Credit Check', provider: 'Experian', status: 'verified', detail: 'Score 880/999. Clean record, all payments on time.' },
    ],
    linkedinUrl: 'https://linkedin.com/in/limeiwong',
    linkedinHeadline: 'Marketing Manager at Burberry | Digital | Luxury',
    creditScore: '880/999 (Good)',
    phoneVerified: true,
    phoneCarrier: 'Vodafone',
    phoneType: 'Mobile',
    emailVerified: true,
    emailDomain: 'burberry.com (Corporate)',
    emailType: 'Corporate',
    workHistory: [
      { company: 'Burberry Group PLC', role: 'Marketing Manager', period: '2022 - Present', current: true },
      { company: 'Burberry Group PLC', role: 'Senior Marketing Executive', period: '2020 - 2022', current: false },
      { company: 'L\'Oréal UK', role: 'Marketing Executive', period: '2018 - 2020', current: false },
    ],
    educationHistory: [
      { institution: 'Central Saint Martins (UAL)', degree: 'MA', field: 'Fashion Marketing', year: '2018' },
      { institution: 'Hong Kong University', degree: 'BA', field: 'Communications', year: '2016' },
    ],
    rightToRent: 'verified',
    previousLandlord: 'Chestertons — 3 year tenancy, excellent',
    tenancyLength: 'Seeking 12-month minimum',
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

function ReferenceCard({ type, provider, status, detail }: { type: string; provider: string; status: 'verified' | 'pending' | 'failed'; detail: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-white">{type}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
          status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>{status === 'verified' ? 'Verified' : status === 'pending' ? 'Pending' : 'Failed'}</span>
      </div>
      <p className="text-xs text-white/40">{provider}</p>
      <p className="text-xs text-white/60 mt-1">{detail}</p>
    </div>
  )
}

export default function GCPEnquirerDetailPage() {
  const params = useParams()

  const enquirer = useMemo(() => {
    return ALL_ENQUIRERS.find((e) => e.id === params.id)
  }, [params.id])

  if (!enquirer) {
    return (
      <div className="space-y-6">
        <Link href="/gcpdemo/enquirers" className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Enquirers
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl py-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Enquirer not found</h3>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const intel = TENANT_INTELLIGENCE[enquirer.id]
  const conversation = getConversationForEnquirer(enquirer.id)
  const nbScore = enquirer.aiScore || 0
  const intentScore = enquirer.intentScore || 0

  const rentPCM = enquirer.linkedUnit
    ? [1850, 2200, 3100, 1900, 2350, 3250, 2150, 1800, 3400, 2100][
        ['1A', '2C', '3B', '4A', '5D', '6B', '7A', '8C', '9B', '10A'].indexOf(enquirer.linkedUnit)
      ] || 2000
    : 2000
  const rentRatio = enquirer.annualIncome > 0 ? ((rentPCM * 12) / enquirer.annualIncome * 100).toFixed(1) : 'N/A'

  const classConfig = nbScore >= 55
    ? { bg: 'bg-emerald-600', text: 'text-white', label: 'Priority', ringBg: 'bg-emerald-500/10 border-emerald-500/30' }
    : nbScore >= 35
    ? { bg: 'bg-amber-500', text: 'text-white', label: 'Qualified', ringBg: 'bg-amber-500/10 border-amber-500/30' }
    : { bg: 'bg-red-500', text: 'text-white', label: 'Low Priority', ringBg: 'bg-red-500/10 border-red-500/30' }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getNextAction = () => {
    switch (enquirer.pipelineStatus) {
      case 'Scored': return 'Contact applicant to confirm interest, employment details, and schedule a viewing.'
      case 'Viewing Booked': return 'Confirm viewing appointment. Prepare unit details and tenancy information pack.'
      case 'Viewing Complete': return 'Follow up post-viewing. If interested, initiate verification process.'
      case 'Verification In Progress': return 'Await verification results. Check credit, employer, and landlord references.'
      case 'Verified': return 'Issue tenancy offer. Confirm move-in date, deposit, and standing order details.'
      case 'Flagged': return 'Review flag reasons. Consider requesting guarantor or additional documentation.'
      default: return 'Review this applicant and determine next steps.'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/gcpdemo/enquirers" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Enquirers
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {enquirer.fullName}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/50 mt-1">
            {enquirer.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {enquirer.email}
              </span>
            )}
            {enquirer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {enquirer.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" /> {enquirer.role} · {enquirer.employer}
            </span>
            {enquirer.linkedUnit && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Home className="w-4 h-4" /> Unit {enquirer.linkedUnit}
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
                <Badge variant="outline" className={`text-xs border-white/20 ${
                  enquirer.riskLevel === 'Low' ? 'text-emerald-400' :
                  enquirer.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  <Shield className="w-3 h-3 mr-1" /> {enquirer.riskLevel} Risk
                </Badge>
                <Badge variant="outline" className={`text-xs ${
                  enquirer.verificationStatus === 'Verified' ? 'border-emerald-500/30 text-emerald-400' :
                  enquirer.verificationStatus === 'Verifying' ? 'border-amber-500/30 text-amber-400' :
                  enquirer.verificationStatus === 'Failed' ? 'border-red-500/30 text-red-400' :
                  'border-white/20 text-white/50'
                }`}>
                  <UserCheck className="w-3 h-3 mr-1" /> {enquirer.verificationStatus}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SubScoreBar label="Quality" score={nbScore} />
                <SubScoreBar label="Intent" score={intentScore} />
                <SubScoreBar label="Affordability" score={parseFloat(String(rentRatio)) <= 30 ? 90 : parseFloat(String(rentRatio)) <= 40 ? 60 : 30} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Tenant Summary */}
      {enquirer.tenantSummary && (
        <div className="bg-[#111111] border border-blue-500/30 rounded-xl">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-1">AI Tenant Summary</h4>
                <p className="text-sm text-white/70 leading-relaxed">{enquirer.tenantSummary}</p>
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
                {enquirer.phone && (
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                )}
                {enquirer.email && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <Mail className="w-4 h-4 mr-1" /> Send Email
                  </Button>
                )}
                {enquirer.phone && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify This Tenant */}
      <div className="bg-[#111111] border border-amber-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Verify This Tenant</h4>
              <p className="text-sm text-white/60 mb-3">Run Right to Rent, credit check, employer reference, and landlord reference via integrated verification.</p>
              <div className="flex gap-2 flex-wrap">
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Run Tenant Verification
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    <DollarSign className="w-4 h-4 mr-1" /> Credit Check
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
              </div>
              <p className="text-[10px] text-white/30 mt-2">Powered by Checkboard — Tenant verification, credit checks & referencing</p>
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
                <span className="text-white/70">{enquirer.phone}</span>
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
                <span className="text-white/70">{enquirer.email}</span>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Annual Income</p>
          <p className="text-lg font-bold text-white mt-1">£{enquirer.annualIncome.toLocaleString()}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Rent PCM</p>
          <p className="text-lg font-bold text-white mt-1">£{rentPCM.toLocaleString()}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Rent-to-Income</p>
          <p className={`text-lg font-bold mt-1 ${
            parseFloat(String(rentRatio)) <= 30 ? 'text-emerald-400' :
            parseFloat(String(rentRatio)) <= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>{rentRatio}%</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Days in Pipeline</p>
          <p className="text-lg font-bold text-white mt-1">{enquirer.daysInPipeline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Personal & Professional Info */}
          {intel && (
            <SectionCard title="Personal & Professional" icon={User} accentColor="text-blue-400">
              <div className="space-y-0">
                <DataRow label="Occupation" value={intel.occupation} icon={Briefcase} />
                <DataRow label="Annual Income" value={intel.estimatedIncome} icon={DollarSign} />
                <DataRow label="Current Address" value={intel.currentAddress} icon={MapPin} />
                <DataRow label="Credit Score" value={intel.creditScore} icon={Shield} />
                <DataRow label="Right to Rent" value={
                  <span className={intel.rightToRent === 'verified' ? 'text-emerald-400' : intel.rightToRent === 'pending' ? 'text-amber-400' : 'text-red-400'}>
                    {intel.rightToRent === 'verified' ? 'Verified' : intel.rightToRent === 'pending' ? 'Pending' : 'Failed'}
                  </span>
                } icon={BadgeCheck} />
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

          {/* Pipeline Status */}
          <SectionCard title="Pipeline Status" icon={CircleDot}>
            <div className="grid grid-cols-2 gap-2">
              {['Scored', 'Viewing Booked', 'Viewing Complete', 'Verification In Progress', 'Verified', 'Tenancy Signed', 'Flagged', 'Fell Through'].map((status) => (
                <Button
                  key={status}
                  variant={enquirer.pipelineStatus === status ? 'default' : 'outline'}
                  size="sm"
                  className={`justify-start text-xs ${enquirer.pipelineStatus !== status ? 'border-white/10 text-white/60 hover:bg-white/5' : ''}`}
                >
                  {enquirer.pipelineStatus === status && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status}
                </Button>
              ))}
            </div>
          </SectionCard>

          {/* References */}
          {intel && (
            <SectionCard title="References & Checks" icon={ShieldCheck} accentColor="text-amber-400">
              <div className="space-y-3">
                {intel.references.map((ref, i) => (
                  <ReferenceCard key={i} {...ref} />
                ))}
              </div>
            </SectionCard>
          )}

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
              <p className="text-sm text-white/40 italic">Click to add notes about this applicant...</p>
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Contact */}
          <SectionCard title="Contact Information" icon={User}>
            <div className="space-y-0">
              <DataRow label="Name" value={enquirer.fullName} icon={User} />
              <DataRow label="Email" value={enquirer.email} icon={Mail} />
              <DataRow label="Phone" value={enquirer.phone} icon={Phone} />
            </div>
          </SectionCard>

          {/* Lettings Requirements */}
          <SectionCard title="Lettings Requirements" icon={Home}>
            <div className="space-y-0">
              <DataRow label="Target Unit" value={enquirer.linkedUnit ? `Unit ${enquirer.linkedUnit}` : 'Not assigned'} icon={Building} />
              <DataRow label="Area" value={enquirer.area} icon={MapPin} />
              <DataRow label="Rent PCM" value={`£${rentPCM.toLocaleString()}`} icon={DollarSign} />
              {intel && <DataRow label="Preferred Term" value={intel.tenancyLength} icon={Calendar} />}
              {intel && <DataRow label="Previous Landlord" value={intel.previousLandlord} icon={UserCheck} />}
            </div>
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Timeline" icon={Clock}>
            <div className="space-y-0">
              <DataRow label="Days in Pipeline" value={`${enquirer.daysInPipeline} days`} icon={Calendar} />
              <DataRow label="Pipeline Status" value={enquirer.pipelineStatus} />
              <DataRow label="Verification" value={enquirer.verificationStatus} />
            </div>
          </SectionCard>

          {/* AI Conversation Preview */}
          {conversation && (
            <SectionCard title="AI Conversation" icon={MessageSquare} accentColor="text-blue-400">
              <div className="space-y-2">
                {conversation.messages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className={`text-xs ${msg.sender === 'ai' ? 'text-blue-300/70' : 'text-white/60'}`}>
                    <span className="font-medium">{msg.sender === 'ai' ? 'AI' : enquirer.firstName}:</span> {msg.content.slice(0, 120)}...
                  </div>
                ))}
                <Link
                  href={`/gcpdemo/conversations?id=${conversation.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  View Full Conversation ({conversation.messages.length} messages)
                </Link>
              </div>
            </SectionCard>
          )}

        </div>
      </div>

    </div>
  )
}
