'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'

type UserType = 'admin' | 'agent' | 'broker' | 'developer'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isAction?: boolean
}

const SUGGESTED_QUESTIONS: Record<UserType, string[]> = {
  admin: [
    'Show me all leads with high NB scores',
    'Run verification checks on recent leads',
    'Which campaigns have the best CPL?',
    'Generate a pipeline summary report',
    'Draft follow-up emails for cold leads',
    'Show me leads that need attention',
  ],
  agent: [
    'Who are my highest-scored leads?',
    'Which leads need follow-up today?',
    'Draft a viewing confirmation email',
    'Show my pipeline summary',
    'Run verification on my top leads',
    'Which leads are ready to proceed?',
  ],
  broker: [
    'Show all active borrowers',
    'Which borrowers need documents?',
    'Generate a finance pipeline report',
    'Draft follow-up for pending applications',
    'Show borrowers with upcoming deadlines',
    'Run credit check summary',
  ],
  developer: [
    'Who are my hottest buyers right now?',
    'Give me a compiled list of engaged leads',
    'Show development availability',
    'Run verification checks on top buyers',
    'Generate campaign performance report',
    'Which leads are ready to reserve?',
  ],
}

const GREETING_CONTEXTS: Record<UserType, string> = {
  admin: 'leads across all campaigns',
  agent: 'assigned leads',
  broker: 'borrower applications',
  developer: 'buyer pipeline',
}

const INPUT_PLACEHOLDERS: Record<UserType, string> = {
  admin: 'Ask about leads, campaigns, run actions...',
  agent: 'Ask about leads, viewings, run actions...',
  broker: 'Ask about borrowers, applications, run actions...',
  developer: 'Ask about buyers, developments, run actions...',
}

function getResponse(question: string, userType: UserType): { content: string; isAction?: boolean } {
  const q = question.toLowerCase()

  // Hot/top leads/buyers/borrowers
  if (q.includes('hot') || q.includes('highest') || q.includes('top') && (q.includes('lead') || q.includes('buyer') || q.includes('borrower'))) {
    if (userType === 'admin') {
      return {
        content: `You currently have **127 hot leads** across all campaigns. Your top performers:\n\n` +
          `1. **Emily Thornton** (NB Score: 93) — Negotiating on The Edit 3-bed. Mortgage AIP secured at £1.8M, solicitor instructed.\n` +
          `2. **James Richardson** (NB Score: 91) — Viewing booked at One Clapham penthouse. Cash buyer, £2.8M budget.\n` +
          `3. **Sarah Chen** (NB Score: 86) — HK investor, £4-6M budget, proof of funds verified.\n` +
          `4. **Alexandra Muller** (NB Score: 82) — Viewing booked at The Edit. Budget £2-3M.\n` +
          `5. **Michael Okonkwo** (NB Score: 77) — Follow up needed. Budget £1.8-2.2M.\n\n` +
          `These leads span 4 active campaigns. Emily Thornton has the highest conversion probability — recommend prioritising her today.`,
      }
    }
    if (userType === 'agent') {
      return {
        content: `Here are your highest-scored assigned leads:\n\n` +
          `1. **Emily Thornton** (NB Score: 93) — Negotiating on The Edit 3-bed. Mortgage AIP secured, solicitor instructed. Ready to close.\n` +
          `2. **James Richardson** (NB Score: 91) — Viewing booked for Thursday at One Clapham penthouse. Cash buyer.\n` +
          `3. **Sarah Chen** (NB Score: 86) — Awaiting follow-up. HK investor, £4-6M budget.\n\n` +
          `**Recommendation:** Emily Thornton is your highest-probability conversion. I'd suggest a call today to push towards reservation.\n\n` +
          `**Quick actions I can take:**\n` +
          `- Draft a follow-up email for Emily\n` +
          `- Send viewing confirmation to James\n` +
          `- Run verification check on Sarah`,
      }
    }
    if (userType === 'broker') {
      return {
        content: `Here are your top-scored active borrowers:\n\n` +
          `1. **Emily Thornton** (NB Score: 93) — AIP secured at £1.8M. Mortgage application in progress. All documents received.\n` +
          `2. **James Richardson** (NB Score: 91) — Cash buyer, no mortgage required. Proof of funds verified.\n` +
          `3. **Michael Okonkwo** (NB Score: 77) — Pre-approval stage. Income verified, awaiting property valuation.\n\n` +
          `Emily's application is furthest along — she could complete within 2 weeks if we push the valuation through.`,
      }
    }
    // developer
    return {
      content: `You currently have **92 hot buyers** out of 847 total. Your top performers:\n\n` +
        `1. **Emily Thornton** (NB Score: 93) — Negotiating on The Edit 3-bed. Mortgage AIP secured at £1.8M, solicitor instructed. Very high conversion probability.\n` +
        `2. **James Richardson** (NB Score: 91) — Viewing booked at One Clapham penthouse. Cash buyer, £2.8M budget.\n` +
        `3. **Sarah Chen** (NB Score: 86) — HK investor, £4-6M budget, proof of funds verified. Interested in One Clapham.\n\n` +
        `I'd recommend prioritising Emily Thornton — she's furthest along in the pipeline and ready to reserve.`,
    }
  }

  // Compiled list / engaged leads / active borrowers
  if (q.includes('compiled list') || q.includes('all engaged') || q.includes('engaged leads') || q.includes('active borrower') || q.includes('all active')) {
    if (userType === 'broker') {
      return {
        content: `**Active Borrowers — Current Pipeline**\n\n` +
          `| # | Borrower | NB Score | Status | Loan Amount | LTV |\n` +
          `|---|---|---|---|---|---|\n` +
          `| 1 | Emily Thornton | 93 | Application Submitted | £1.8M | 75% |\n` +
          `| 2 | Michael Okonkwo | 77 | Pre-Approval | £1.5M | 80% |\n` +
          `| 3 | Alexandra Muller | 82 | AIP Issued | £2.1M | 70% |\n` +
          `| 4 | Priya Sharma | 71 | Document Collection | £1.2M | 85% |\n` +
          `| 5 | David Osei | 63 | Initial Enquiry | £500K | 90% |\n\n` +
          `**5 active borrowers** with a combined loan value of **£7.1M**. Want me to generate a status report or flag overdue documents?`,
        isAction: true,
      }
    }
    return {
      content: `**Compiled List of Engaged Leads** (Status: Follow Up, Viewing Booked, or Negotiating)\n\n` +
        `| # | Name | NB Score | Status | Development | Budget |\n` +
        `|---|---|---|---|---|---|\n` +
        `| 1 | Emily Thornton | 93 | Negotiating | The Edit | £1.5-2M |\n` +
        `| 2 | James Richardson | 91 | Viewing Booked | One Clapham | £2.5-3.5M |\n` +
        `| 3 | Sarah Chen | 86 | Follow Up | One Clapham | £4-6M |\n` +
        `| 4 | Alexandra Muller | 82 | Viewing Booked | The Edit | £2-3M |\n` +
        `| 5 | Michael Okonkwo | 77 | Follow Up | The Broadley | £1.8-2.2M |\n` +
        `| 6 | David Osei | 63 | Follow Up | The Broadley | £500-750K |\n\n` +
        `**6 engaged leads** with a combined pipeline value of **£15.3M-£20.4M**. Want me to export this list or send it to your email?`,
      isAction: true,
    }
  }

  // Pipeline / summary / overview
  if (q.includes('pipeline') || q.includes('summary') || q.includes('summarise') || q.includes('overview') || q.includes('report') && (q.includes('pipeline') || q.includes('finance'))) {
    if (userType === 'admin') {
      return {
        content: `**Admin Pipeline Summary — All Campaigns:**\n\n` +
          `- **1,247** total leads across all campaigns\n` +
          `- **127** hot leads (10.2% of total)\n` +
          `- **134** viewings booked\n` +
          `- **52** in negotiation\n` +
          `- **24** reserved\n` +
          `- **18** completed\n\n` +
          `**Campaign breakdown:**\n` +
          `- The Edit: 312 leads (38 hot)\n` +
          `- One Clapham: 405 leads (42 hot)\n` +
          `- The Broadley: 348 leads (31 hot)\n` +
          `- Queens Cross: 182 leads (16 hot)\n\n` +
          `**Conversion rate:** 1.4% (lead to completed)\n` +
          `**Avg NB Score:** 62\n\n` +
          `182 leads are awaiting first contact — prioritising NB Score 80+ could move 20-25 into viewing stage this week.`,
      }
    }
    if (userType === 'agent') {
      return {
        content: `**Your Pipeline Summary:**\n\n` +
          `- **48** assigned leads\n` +
          `- **8** hot leads (NB Score 80+)\n` +
          `- **12** viewings booked this week\n` +
          `- **5** in negotiation\n` +
          `- **3** reserved\n\n` +
          `**Priority actions today:**\n` +
          `1. Follow up with Emily Thornton (negotiating, Score 93)\n` +
          `2. Confirm viewing with James Richardson (Thursday)\n` +
          `3. Call Sarah Chen (Score 86, awaiting follow-up)\n\n` +
          `**Conversion rate:** 6.3% (lead to reserved)\n` +
          `**Avg NB Score of your leads:** 71\n\n` +
          `Your pipeline is performing above team average. 5 leads need first contact today.`,
      }
    }
    if (userType === 'broker') {
      return {
        content: `**Finance Pipeline Report:**\n\n` +
          `- **23** active borrower applications\n` +
          `- **5** AIP issued\n` +
          `- **8** applications submitted to lender\n` +
          `- **4** awaiting valuation\n` +
          `- **3** offers received\n` +
          `- **3** completed\n\n` +
          `**Total loan value in pipeline:** £18.4M\n` +
          `**Avg processing time:** 28 days\n` +
          `**Success rate:** 78%\n\n` +
          `**Urgent:** 2 applications have valuation deadlines this week. 3 borrowers have outstanding document requests past 5 days.`,
      }
    }
    // developer
    return {
      content: `**Development Pipeline Summary:**\n\n` +
        `- **847** total leads in pipeline\n` +
        `- **92** hot leads (11% of total)\n` +
        `- **89** viewings booked\n` +
        `- **37** in negotiation\n` +
        `- **18** reserved\n` +
        `- **12** completed\n\n` +
        `**Conversion rate:** 1.4% (lead to completed)\n` +
        `**Avg NB Score:** 64\n\n` +
        `The pipeline is healthy with strong international interest. 147 leads are still awaiting first contact — prioritising those with NB Score 80+ could move 15-20 into the viewing stage this week.`,
    }
  }

  // Follow-up / cold leads / pending applications
  if (q.includes('follow up') || q.includes('follow-up') || q.includes('cold') || q.includes('pending application')) {
    if (userType === 'admin') {
      return {
        content: `**Action: Follow-up Campaign Queued for Cold Leads**\n\n` +
          `I've identified **68 cold leads** across all campaigns that haven't been contacted in 14+ days.\n\n` +
          `**Breakdown by campaign:**\n` +
          `- The Edit: 18 cold leads\n` +
          `- One Clapham: 22 cold leads\n` +
          `- The Broadley: 19 cold leads\n` +
          `- Queens Cross: 9 cold leads\n\n` +
          `**Proposed channels:**\n` +
          `- 32 via Email\n` +
          `- 24 via WhatsApp\n` +
          `- 12 via SMS\n\n` +
          `Each message will be personalised with their name, development interest, and latest availability updates. Shall I proceed with sending, or would you like to review the templates first?`,
        isAction: true,
      }
    }
    if (userType === 'agent') {
      return {
        content: `**Leads Needing Follow-up Today:**\n\n` +
          `1. **Sarah Chen** (NB Score: 86) — Last contact 5 days ago. Awaiting response on viewing times.\n` +
          `2. **Michael Okonkwo** (NB Score: 77) — Requested pricing info 3 days ago, no response sent yet.\n` +
          `3. **David Osei** (NB Score: 63) — Initial enquiry 7 days ago, needs first call.\n\n` +
          `**Draft messages ready:**\n` +
          `I've prepared personalised follow-up messages for each. Preview:\n` +
          `> "Hi Sarah, hope you're well. Following up on our conversation about One Clapham — I have some new availability to share. Would Tuesday or Wednesday work for a video viewing?"\n\n` +
          `Shall I send these, or would you like to edit them first?`,
        isAction: true,
      }
    }
    if (userType === 'broker') {
      return {
        content: `**Action: Follow-up Drafted for Pending Applications**\n\n` +
          `I've identified **7 borrowers** with pending applications requiring follow-up:\n\n` +
          `1. **Priya Sharma** — Missing: 3 months bank statements. Requested 6 days ago.\n` +
          `2. **David Osei** — Missing: Employer reference letter. Requested 4 days ago.\n` +
          `3. **Michael Okonkwo** — Valuation overdue by 3 days. Chase surveyor.\n\n` +
          `**Draft message preview:**\n` +
          `> "Hi [Name], just a quick reminder that we're still awaiting your [document]. To keep your application on track, could you send this through by [date]? Happy to help if you have any questions."\n\n` +
          `Each message is personalised with their specific outstanding items. Ready to send — shall I proceed?`,
        isAction: true,
      }
    }
    // developer
    return {
      content: `**Action: Follow-up Messages Queued for Cold Leads**\n\n` +
        `I've drafted personalised follow-up messages for **24 cold leads** based on their original enquiry, development interest, and time since last contact.\n\n` +
        `**Channels:**\n` +
        `- 12 via WhatsApp (preferred channel)\n` +
        `- 8 via Email\n` +
        `- 4 via SMS\n\n` +
        `**Template preview:**\n` +
        `> "Hi [Name], hope you're well. We have some exciting updates on [Development] including new pricing and availability. Would you like to schedule a catch-up call this week?"\n\n` +
        `Each message is personalised with their name, development interest, and budget context. Ready to send — shall I proceed?`,
      isAction: true,
    }
  }

  // Verification / KYC / AML
  if (q.includes('verification') || q.includes('verify') || q.includes('kyc') || q.includes('aml') || q.includes('credit check')) {
    if (userType === 'admin') {
      return {
        content: `**Verification Check — Recent Leads (Last 7 Days)**\n\n` +
          `Running via Checkboard integration on **12 new leads**...\n\n` +
          `**Results:**\n` +
          `- **10 leads** — All checks passed (KYC, AML, Sanctions)\n` +
          `- **1 lead** — Partial name match on PEP list (false positive confirmed)\n` +
          `- **1 lead** — Awaiting ID document upload\n\n` +
          `**Summary:**\n` +
          `- KYC Pass Rate: 92%\n` +
          `- AML Clear Rate: 100%\n` +
          `- Outstanding: 1 ID verification pending\n\n` +
          `The pending lead has been sent an automated reminder to upload their ID. Full report available on Checkboard.`,
        isAction: true,
      }
    }
    if (userType === 'agent') {
      return {
        content: `**Verification Check — Your Top Leads**\n\n` +
          `Running KYC/AML checks via Checkboard...\n\n` +
          `**Emily Thornton** (NB Score: 93):\n` +
          `- Identity: **VERIFIED** (passport)\n` +
          `- Address: **VERIFIED** (utility bill)\n` +
          `- AML/Sanctions: **CLEAR**\n` +
          `- Proof of Funds: **VERIFIED**\n\n` +
          `**James Richardson** (NB Score: 91):\n` +
          `- Identity: **VERIFIED** (passport)\n` +
          `- Address: **VERIFIED** (bank statement)\n` +
          `- AML/Sanctions: **CLEAR**\n` +
          `- Proof of Funds: **VERIFIED** (cash buyer)\n\n` +
          `**Sarah Chen** (NB Score: 86):\n` +
          `- Identity: **VERIFIED** (passport)\n` +
          `- Address: **PENDING** (awaiting HK address proof)\n` +
          `- AML/Sanctions: **CLEAR**\n` +
          `- Proof of Funds: **VERIFIED**\n\n` +
          `2 of 3 leads are fully verified. Sarah Chen needs address verification — shall I send her a reminder?`,
        isAction: true,
      }
    }
    if (userType === 'broker') {
      return {
        content: `**Credit Check Summary — Active Borrowers**\n\n` +
          `Running credit and affordability checks...\n\n` +
          `| Borrower | Credit Score | Affordability | Status |\n` +
          `|---|---|---|---|\n` +
          `| Emily Thornton | 742 (Excellent) | £1.9M max | Approved |\n` +
          `| Michael Okonkwo | 698 (Good) | £1.6M max | Approved |\n` +
          `| Alexandra Muller | 721 (Excellent) | £2.3M max | Approved |\n` +
          `| Priya Sharma | 665 (Fair) | £1.1M max | Review |\n` +
          `| David Osei | 634 (Fair) | £520K max | Review |\n\n` +
          `**3 borrowers** fully approved. **2 borrowers** flagged for review — Priya's affordability is tight at 85% LTV, and David may need a guarantor.\n\n` +
          `Shall I generate detailed credit reports or flag these for manual review?`,
        isAction: true,
      }
    }
    // developer
    return {
      content: `**Verification Check — Top Buyers**\n\n` +
        `Running via Checkboard integration...\n\n` +
        `**KYC (Know Your Customer):**\n` +
        `- Emily Thornton: **PASSED**\n` +
        `- James Richardson: **PASSED**\n` +
        `- Sarah Chen: **PASSED**\n` +
        `- Mohammed Al-Rashid: **PASSED**\n\n` +
        `**AML (Anti-Money Laundering):**\n` +
        `- All 4 buyers: **CLEAR** — No sanctions, PEP, or adverse media matches\n\n` +
        `**Proof of Funds:**\n` +
        `- 3 of 4 verified. Mohammed Al-Rashid — awaiting updated bank statement (requested 2 days ago)\n\n` +
        `All top buyers are verified and cleared to proceed to reservation. Full reports available on Checkboard.`,
      isAction: true,
    }
  }

  // Campaign performance
  if (q.includes('campaign') || q.includes('spend') || q.includes('cpl') || q.includes('marketing') || q.includes('performance')) {
    if (userType === 'admin') {
      return {
        content: `**Campaign Performance — All Active Campaigns:**\n\n` +
          `**Total spend:** £284,500 across 12 active campaigns\n` +
          `**Total leads generated:** 1,247\n` +
          `**Average CPL:** £228\n\n` +
          `**Top performers by CPL:**\n` +
          `- The Edit — Rightmove Featured: **£144 CPL** (best performer)\n` +
          `- The Broadley — Meta International: **£204 CPL**\n` +
          `- Queens Cross — Instagram UK: **£215 CPL**\n` +
          `- The Edit — Meta UK: **£227 CPL**\n\n` +
          `**Underperformers:**\n` +
          `- One Clapham — Zoopla Premium: **£312 CPL** (recommend pause)\n` +
          `- Queens Cross — Google Display: **£298 CPL** (low conversion)\n\n` +
          `**Recommendation:** Reallocate £15K from underperforming Zoopla and Google Display campaigns to Rightmove Featured, which is outperforming by 53% on CPL.`,
      }
    }
    if (userType === 'agent') {
      return {
        content: `Here's how your leads break down by source:\n\n` +
          `**Your lead sources:**\n` +
          `- Rightmove: 18 leads (avg NB Score: 74)\n` +
          `- Website Direct: 12 leads (avg NB Score: 68)\n` +
          `- Meta Ads: 10 leads (avg NB Score: 61)\n` +
          `- Referrals: 5 leads (avg NB Score: 82)\n` +
          `- Walk-ins: 3 leads (avg NB Score: 71)\n\n` +
          `**Key insight:** Your referral leads have the highest average NB Score at 82 — they convert 3x better than Meta leads. Consider asking your top clients for referrals.`,
      }
    }
    if (userType === 'broker') {
      return {
        content: `**Referral Source Performance:**\n\n` +
          `| Source | Applications | Completion Rate | Avg Loan |\n` +
          `|---|---|---|---|\n` +
          `| Agent Referrals | 12 | 83% | £1.6M |\n` +
          `| Developer Direct | 6 | 67% | £1.9M |\n` +
          `| Website | 3 | 50% | £800K |\n` +
          `| Repeat Clients | 2 | 100% | £2.1M |\n\n` +
          `**Agent referrals** are your strongest channel with 83% completion rate. Consider strengthening referral relationships with top-performing agents.`,
      }
    }
    // developer
    return {
      content: `Here's your campaign overview:\n\n` +
        `**Total spend:** £184,500 across 7 active campaigns\n` +
        `**Total leads generated:** 847\n` +
        `**Average CPL:** £218\n\n` +
        `**Top performers:**\n` +
        `- The Edit — Rightmove Featured: £144 CPL (best performer)\n` +
        `- The Broadley — Meta International: £204 CPL\n` +
        `- The Edit — Meta UK: £227 CPL\n\n` +
        `**Recommendation:** The Rightmove Featured campaign is outperforming Meta by 37% on CPL. Consider reallocating budget from the One Clapham Zoopla campaign (paused, £238 CPL) to Rightmove.`,
    }
  }

  // Status / attention / needs / deadlines / documents / ready to proceed/reserve
  if (q.includes('attention') || q.includes('need') || q.includes('deadline') || q.includes('document') || q.includes('ready to proceed') || q.includes('ready to reserve')) {
    if (userType === 'admin') {
      return {
        content: `**Leads Needing Attention:**\n\n` +
          `**Urgent (action required today):**\n` +
          `1. **Sarah Chen** (Score: 86) — No follow-up in 5 days. High-value HK investor at risk of going cold.\n` +
          `2. **Michael Okonkwo** (Score: 77) — Pricing request unanswered for 3 days.\n` +
          `3. **Campaign alert:** One Clapham Zoopla campaign overspending — £312 CPL vs £228 target.\n\n` +
          `**This week:**\n` +
          `- 14 leads awaiting first contact (assigned but untouched)\n` +
          `- 3 viewings need confirmation\n` +
          `- 2 verification checks expiring in 48 hours\n\n` +
          `Want me to auto-assign the untouched leads or draft follow-up messages for the urgent ones?`,
        isAction: true,
      }
    }
    if (userType === 'agent') {
      return {
        content: `**Leads Ready to Proceed:**\n\n` +
          `1. **Emily Thornton** (Score: 93) — Fully verified, mortgage AIP secured, solicitor instructed. Ready for reservation.\n` +
          `2. **James Richardson** (Score: 91) — Cash buyer, fully verified. Viewing Thursday — if positive, can proceed immediately.\n\n` +
          `**Leads needing action:**\n` +
          `- **Sarah Chen** — Needs address verification to complete KYC\n` +
          `- **Michael Okonkwo** — Awaiting pricing info response from you\n\n` +
          `Shall I draft a reservation email for Emily, or send the pricing info to Michael?`,
        isAction: true,
      }
    }
    if (userType === 'broker') {
      return {
        content: `**Borrowers with Upcoming Deadlines:**\n\n` +
          `**This week:**\n` +
          `1. **Michael Okonkwo** — Property valuation deadline: Wednesday. Surveyor not yet booked.\n` +
          `2. **Priya Sharma** — Bank statements due: Thursday. Reminder sent 2 days ago.\n` +
          `3. **Emily Thornton** — Mortgage offer expires: Friday. Exchange needs to happen ASAP.\n\n` +
          `**Outstanding documents:**\n` +
          `- Priya Sharma: 3 months bank statements\n` +
          `- David Osei: Employer reference letter\n` +
          `- Michael Okonkwo: Updated payslip (current month)\n\n` +
          `Shall I send reminders to the borrowers with outstanding documents?`,
        isAction: true,
      }
    }
    // developer
    return {
      content: `**Leads Ready to Reserve:**\n\n` +
        `1. **Emily Thornton** (Score: 93) — Fully verified, mortgage AIP secured, solicitor instructed. Negotiating on The Edit 3-bed. Ready to sign reservation agreement.\n` +
        `2. **James Richardson** (Score: 91) — Cash buyer, all checks passed. Viewing Thursday at One Clapham penthouse — high conversion probability.\n\n` +
        `**Nearly ready (1-2 actions needed):**\n` +
        `- **Sarah Chen** (Score: 86) — Needs address verification, then cleared to reserve.\n` +
        `- **Alexandra Muller** (Score: 82) — Viewing booked, awaiting feedback.\n\n` +
        `Shall I draft reservation agreements for Emily and James, or send viewing follow-ups to the others?`,
      isAction: true,
    }
  }

  // Viewing confirmation (agent-specific)
  if (q.includes('viewing') && (q.includes('confirm') || q.includes('draft'))) {
    return {
      content: `**Draft: Viewing Confirmation Email**\n\n` +
        `**To:** James Richardson\n` +
        `**Subject:** Your Viewing at One Clapham — Thursday 2:00 PM\n\n` +
        `> Dear James,\n` +
        `>\n` +
        `> I'm pleased to confirm your viewing at One Clapham penthouse this Thursday at 2:00 PM.\n` +
        `>\n` +
        `> **Details:**\n` +
        `> - Property: One Clapham, Penthouse Suite\n` +
        `> - Date: Thursday, 2:00 PM\n` +
        `> - Address: One Clapham, SW4 7AB\n` +
        `>\n` +
        `> Please bring a valid photo ID. I'll be there to greet you and walk you through the property.\n` +
        `>\n` +
        `> Looking forward to meeting you.\n\n` +
        `Ready to send — shall I proceed, or would you like to make any changes?`,
      isAction: true,
    }
  }

  // Development availability
  if (q.includes('development') || q.includes('availability') || q.includes('units') || q.includes('sold')) {
    return {
      content: `Here's your development portfolio:\n\n` +
        `| Development | Total | Available | Sold |\n` +
        `|---|---|---|---|\n` +
        `| The Broadley | 148 | 54 | 94 |\n` +
        `| Queens Cross | 172 | 172 | 0 (Coming Soon) |\n` +
        `| One Clapham | 205 | 32 | 173 (84% sold) |\n` +
        `| The Edit | 116 | 19 | 97 |\n\n` +
        `**The Broadley** has the most availability with 54 units. **One Clapham** is nearly sold out — consider a "final units" push.`,
    }
  }

  // Individual lead lookup
  if (q.includes('james') || q.includes('richardson')) {
    return {
      content: `**James Richardson** — NB Score: 91 (Hot Lead)\n\n` +
        `- **Status:** Viewing Booked\n` +
        `- **Budget:** £2.5M-£3.5M\n` +
        `- **Development:** One Clapham (penthouse)\n` +
        `- **Source:** Rightmove\n` +
        `- **Profile:** Verified cash buyer. Solicitor already instructed.\n\n` +
        `**AI Assessment:** Very high intent and quality scores. This buyer is ready to move quickly. Recommend ensuring the viewing experience is premium-level to convert.\n\n` +
        `**Quick actions I can take:**\n` +
        `- Run KYC/AML verification check\n` +
        `- Send viewing confirmation message\n` +
        `- Generate buyer intelligence report`,
    }
  }

  if (q.includes('emily') || q.includes('thornton')) {
    return {
      content: `**Emily Thornton** — NB Score: 93 (Hot Lead)\n\n` +
        `- **Status:** Negotiating\n` +
        `- **Budget:** £1.5M-£2M\n` +
        `- **Development:** The Edit (3-bed)\n` +
        `- **Source:** Website\n` +
        `- **Profile:** UK-based primary residence buyer. Mortgage AIP secured at £1.8M. Solicitor instructed. Offer already submitted.\n\n` +
        `**AI Assessment:** Highest conversion probability in your pipeline. Intent score 95/100. Follow up today to close.\n\n` +
        `**Quick actions I can take:**\n` +
        `- Send pricing update email\n` +
        `- Run verification check via Checkboard\n` +
        `- Draft reservation agreement`,
    }
  }

  if (q.includes('sarah') || q.includes('chen')) {
    return {
      content: `**Sarah Chen** — NB Score: 86 (Hot Lead)\n\n` +
        `- **Status:** Follow Up\n` +
        `- **Budget:** £4M-£6M\n` +
        `- **Development:** One Clapham\n` +
        `- **Source:** Referral\n` +
        `- **Profile:** Hong Kong-based investor. Proof of funds verified. Looking for 2+ bed Zone 1 investment. Ready within 28 days.\n\n` +
        `**AI Assessment:** High-value international investor. Book a video viewing this week to maintain momentum.`,
    }
  }

  // Score explanation
  if (q.includes('score') || q.includes('nb score') || q.includes('scoring')) {
    return {
      content: `**NB Score** is Naybourhood's AI-powered lead quality score (0-100) that combines:\n\n` +
        `- **Quality Score** — Buyer's financial strength, verification status, budget\n` +
        `- **Intent Score** — How ready they are to buy (timeline, solicitor instructed, AIP status)\n` +
        `- **Confidence Score** — How reliable the data is\n\n` +
        `**Your portfolio breakdown:**\n` +
        `- Score 80+ (Hot): Prioritise for immediate contact\n` +
        `- Score 60-79 (Qualified): Nurture with viewings\n` +
        `- Score 40-59 (Needs Qualification): More info needed\n` +
        `- Score <40 (Nurture): Long-term pipeline`,
    }
  }

  // Default fallback
  if (userType === 'admin') {
    return {
      content: `Based on your admin overview:\n\n` +
        `- **1,247 leads** across all campaigns and developments\n` +
        `- **127 hot leads** with an average NB Score of 62\n` +
        `- **£284,500** total campaign spend at £228 avg CPL\n` +
        `- **12 active campaigns** across 4 developments\n\n` +
        `**I can help you with:**\n` +
        `- Lead management across all campaigns\n` +
        `- Verification checks and compliance reports\n` +
        `- Campaign performance analysis\n` +
        `- Follow-up automation for cold leads\n` +
        `- Pipeline reports and exports\n\n` +
        `What would you like me to do?`,
    }
  }

  if (userType === 'agent') {
    return {
      content: `Here's a snapshot of your assigned leads:\n\n` +
        `- **48 assigned leads** across 3 developments\n` +
        `- **8 hot leads** (NB Score 80+)\n` +
        `- **12 viewings** booked this week\n` +
        `- **5 leads** in negotiation\n\n` +
        `**I can help you with:**\n` +
        `- Lead prioritisation and follow-ups\n` +
        `- Draft emails and messages\n` +
        `- Run verification checks on leads\n` +
        `- Pipeline summaries and status updates\n` +
        `- Viewing scheduling and confirmations\n\n` +
        `What would you like me to do?`,
    }
  }

  if (userType === 'broker') {
    return {
      content: `Here's your borrower overview:\n\n` +
        `- **23 active applications** in your pipeline\n` +
        `- **£18.4M** total loan value\n` +
        `- **5 AIP issued**, 8 submitted to lender\n` +
        `- **78% success rate** on completed applications\n\n` +
        `**I can help you with:**\n` +
        `- Borrower status and document tracking\n` +
        `- Credit check summaries\n` +
        `- Follow-up reminders for pending documents\n` +
        `- Finance pipeline reports\n` +
        `- Deadline management and alerts\n\n` +
        `What would you like me to do?`,
    }
  }

  // developer default
  return {
    content: `Based on your development portfolio:\n\n` +
      `- **847 leads** across 4 developments (7 active campaigns)\n` +
      `- **92 hot leads** with an average NB Score of 64\n` +
      `- **£184,500** campaign spend generating leads at £218 avg CPL\n` +
      `- Your strongest leads are Emily Thornton (Score 93, negotiating) and James Richardson (Score 91, viewing booked)\n\n` +
      `**I can help you with:**\n` +
      `- Compiled lists of leads by status, budget, or development\n` +
      `- Send follow-up messages to specific lead segments\n` +
      `- Run KYC/AML verification checks via Checkboard\n` +
      `- Campaign performance analysis and recommendations\n` +
      `- Development availability and sales reports\n\n` +
      `What would you like me to do?`,
  }
}

export function NBAIChat({ userType }: { userType: 'admin' | 'agent' | 'broker' | 'developer' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your NB AI assistant. I can help you manage your ${GREETING_CONTEXTS[userType]}, run verification checks, compile reports, and take actions. What would you like to do?`,
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text?: string) => {
    const message = text || input.trim()
    if (!message) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setIsTyping(true)

    // Simulate a brief thinking delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))

    const response = getResponse(message, userType)
    setMessages((prev) => [...prev, { role: 'assistant', content: response.content, isAction: response.isAction }])
    setIsTyping(false)
  }

  const suggestedQuestions = SUGGESTED_QUESTIONS[userType]

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-all hover:scale-105"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111111]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">NB AI Assistant</p>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[420px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-sm'
                      : msg.isAction
                      ? 'bg-amber-500/10 text-white/80 border border-amber-500/20 rounded-bl-sm'
                      : 'bg-[#1A1A1A] text-white/80 border border-white/5 rounded-bl-sm'
                  }`}
                >
                  {msg.isAction && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium mb-1.5">
                      <Sparkles className="h-3 w-3" />
                      Action
                    </div>
                  )}
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                      .replace(/\n/g, '<br />')
                  }} />
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2 bg-[#111111] rounded-xl px-3 py-2">
              <input
                type="text"
                placeholder={INPUT_PLACEHOLDERS[userType]}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="text-emerald-400 hover:text-emerald-300 disabled:text-white/20 transition-colors"
              >
                {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
