'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isAction?: boolean
}

const SUGGESTED_QUESTIONS = [
  'Who are my top-rated applicants right now?',
  'Give me a compiled list of all active enquirers',
  'Send follow up message to all unresponsive applicants',
  'Run daily verification report on all tenants',
  'Complete reference check on Marcus Weber',
  'Put all applicants with NB Score 80+ in email',
]

/** Agentic AI responses — uses Aroundtown Kensington demo data context */
function getDemoResponse(question: string): { content: string; isAction?: boolean } {
  const q = question.toLowerCase()

  if (q.includes('top') && (q.includes('applicant') || q.includes('tenant') || q.includes('enquirer') || q.includes('rated'))) {
    return {
      content: `You currently have **12 priority applicants** out of 60 total. Your top performers right now:\n\n` +
        `1. **Marcus Weber** (NB Score: 92) — Verified tenant for Unit 1A. Deutsche Bank VP, £185K income. Tenancy agreement reviewed, deposit confirmed.\n` +
        `2. **Sophie Chen** (NB Score: 88) — Viewing complete for Unit 3B. HSBC associate, clean credit. Application submitted.\n` +
        `3. **Amara Osei** (NB Score: 85) — Viewing booked for Unit 2C. Deloitte consultant, strong employer reference.\n\n` +
        `I'd recommend prioritising Marcus Weber — he's furthest along and ready to sign.`,
    }
  }

  if (q.includes('compiled list') || q.includes('all active') || q.includes('active enquirers') || q.includes('engaged')) {
    return {
      content: `**Compiled List of Active Enquirers** (Status: Scored, Viewing Booked, Viewing Complete, or Verifying)\n\n` +
        `| # | Name | NB Score | Status | Unit | Rent PCM |\n` +
        `|---|---|---|---|---|---|\n` +
        `| 1 | Marcus Weber | 92 | Verified | 1A | £1,850 |\n` +
        `| 2 | Sophie Chen | 88 | Viewing Complete | 3B | £3,100 |\n` +
        `| 3 | Amara Osei | 85 | Viewing Booked | 2C | £2,200 |\n` +
        `| 4 | James Okafor | 79 | Scored | 4A | £1,900 |\n` +
        `| 5 | Raj Kapoor | 76 | Scored | 5D | £2,350 |\n` +
        `| 6 | Li Mei Wong | 74 | Viewing Booked | 6B | £3,250 |\n\n` +
        `**6 active applicants** with a combined annual rent value of **£176,400**. Want me to export this list or send it to your email?`,
      isAction: true,
    }
  }

  if (q.includes('follow up') && (q.includes('unresponsive') || q.includes('cold') || q.includes('all'))) {
    return {
      content: `**Action: Follow-up Messages Queued for Unresponsive Applicants**\n\n` +
        `I've drafted personalised follow-up messages for **8 unresponsive applicants** based on their original enquiry, preferred unit, and time since last contact.\n\n` +
        `**Channels:**\n` +
        `- 4 via WhatsApp (preferred channel)\n` +
        `- 3 via Email\n` +
        `- 1 via SMS\n\n` +
        `**Template preview:**\n` +
        `> "Hi [Name], hope you're well. We still have availability at London Kensington Serviced Apartments and your preferred [unit type] is still available. Would you like to arrange a viewing this week?"\n\n` +
        `Each message is personalised with their name, unit interest, and budget. Ready to send — shall I proceed?`,
      isAction: true,
    }
  }

  if (q.includes('verification') && q.includes('report') || q.includes('daily') && q.includes('report')) {
    return {
      content: `**Daily Verification Report — All Active Tenants**\n\n` +
        `Screening **8 active applicants** against credit agencies, employer databases, and landlord reference systems.\n\n` +
        `**Results:**\n` +
        `- **Marcus Weber** — Fully verified. Clean credit (Excellent). Employer confirmed.\n` +
        `- **Sophie Chen** — Fully verified. Clean credit (Good). HSBC employment confirmed.\n` +
        `- **Amara Osei** — Verified. Clean credit. Deloitte reference received.\n` +
        `- **James Okafor** — Verified. Google employment confirmed. Credit: Excellent.\n` +
        `- **Raj Kapoor** — Verified. NHS employment confirmed. Credit: Good.\n` +
        `- **Li Mei Wong** — Pending. Awaiting Burberry employer reference.\n` +
        `- **Elena Petrov** — Verified. Imperial College confirmed. Credit: Fair.\n` +
        `- **Tom Richards** — **FLAGGED**. CCJ found (2023). Company dissolved. Recommend guarantor.\n\n` +
        `**7/8 passed**, 1 flagged. Tom Richards requires further review. I can set up automated daily reports — would you like to enable this?`,
      isAction: true,
    }
  }

  if (q.includes('reference') || q.includes('verify') || q.includes('check on')) {
    const tenantName = q.includes('marcus') ? 'Marcus Weber' :
      q.includes('sophie') ? 'Sophie Chen' :
      q.includes('amara') ? 'Amara Osei' :
      q.includes('james') ? 'James Okafor' :
      q.includes('tom') ? 'Tom Richards' : 'Marcus Weber'

    const isTom = tenantName === 'Tom Richards'

    return {
      content: `**Reference Check Initiated: ${tenantName}**\n\n` +
        `Running via integrated verification...\n\n` +
        `**Credit Check (Experian):**\n` +
        `- Credit score: ${isTom ? '520 (Poor) — CCJ registered March 2023' : '780+ (Excellent)'}\n` +
        `- Result: **${isTom ? 'FLAGGED' : 'PASSED'}**\n\n` +
        `**Employer Reference:**\n` +
        `- ${isTom ? 'Previous company dissolved (Companies House)' : 'Employment confirmed by HR department'}\n` +
        `- Result: **${isTom ? 'FAILED' : 'PASSED'}**\n\n` +
        `**Previous Landlord Reference:**\n` +
        `- ${isTom ? 'No reference available — private landlord uncontactable' : 'Good tenant, rent paid on time, no issues reported'}\n` +
        `- Result: **${isTom ? 'UNVERIFIED' : 'PASSED'}**\n\n` +
        `**Right to Rent:**\n` +
        `- ${isTom ? 'UK passport verified' : 'Document verified'}\n` +
        `- Result: **PASSED**\n\n` +
        `${isTom ? `Overall: **CAUTION** — Adverse credit history and unverifiable employment. Recommend requesting a guarantor or 6 months rent in advance.` : `All checks complete. ${tenantName} is **fully verified** and cleared to proceed with tenancy offer.`}`,
      isAction: true,
    }
  }

  if (q.includes('80+') || q.includes('score') && q.includes('email') || q.includes('high') && q.includes('score')) {
    return {
      content: `**Action: High-Score Applicants Email Compiled**\n\n` +
        `Found **3 applicants with NB Score 80+**:\n\n` +
        `1. **Marcus Weber** — Score 92 (Unit 1A, £1,850 PCM)\n` +
        `2. **Sophie Chen** — Score 88 (Unit 3B, £3,100 PCM)\n` +
        `3. **Amara Osei** — Score 85 (Unit 2C, £2,200 PCM)\n\n` +
        `**Combined annual rent value: £85,800**\n\n` +
        `Email draft ready with applicant summary, NB Scores, verification status, and recommended next actions. Sending to demo@aroundtown.de — shall I proceed?`,
      isAction: true,
    }
  }

  if (q.includes('pipeline') || q.includes('summary') || q.includes('overview')) {
    return {
      content: `**Aroundtown Kensington Pipeline Summary:**\n\n` +
        `- **60** total enquirers in pipeline\n` +
        `- **12** priority applicants (NB Score 70+)\n` +
        `- **8** viewings booked\n` +
        `- **5** viewing complete\n` +
        `- **3** verification in progress\n` +
        `- **4** verified and ready for offer\n` +
        `- **2** tenancy signed\n\n` +
        `**Occupancy:** 60/70 units occupied (85.7%)\n` +
        `**Available:** 10 units\n` +
        `**Avg NB Score:** 64\n\n` +
        `The pipeline is healthy. Prioritising the 12 high-score applicants could fill 4-5 more units this month.`,
    }
  }

  if (q.includes('marcus') || q.includes('weber')) {
    return {
      content: `**Marcus Weber** — NB Score: 92 (Priority)\n\n` +
        `- **Status:** Verified\n` +
        `- **Unit:** 1A (£1,850 PCM)\n` +
        `- **Employer:** Deutsche Bank — VP, Corporate Finance\n` +
        `- **Income:** £185,000 p.a.\n` +
        `- **Rent-to-Income:** 12% (excellent)\n` +
        `- **Credit:** Excellent (780+)\n` +
        `- **Right to Rent:** Verified\n\n` +
        `**AI Assessment:** Outstanding applicant. Stable high income, clean credit, fully verified references. Ready to sign. Recommend issuing tenancy offer immediately.\n\n` +
        `**Quick actions I can take:**\n` +
        `- Draft tenancy agreement\n` +
        `- Send move-in welcome pack\n` +
        `- Generate tenant report`,
    }
  }

  if (q.includes('sophie') || q.includes('chen')) {
    return {
      content: `**Sophie Chen** — NB Score: 88 (Priority)\n\n` +
        `- **Status:** Viewing Complete\n` +
        `- **Unit:** 3B (2-bed, £3,100 PCM)\n` +
        `- **Employer:** HSBC — Senior Associate\n` +
        `- **Income:** £95,000 p.a.\n` +
        `- **Rent-to-Income:** 39.2% (borderline — consider guarantor)\n` +
        `- **Credit:** Good\n\n` +
        `**AI Assessment:** Strong professional profile but rent-to-income is slightly above the 35% threshold. Consider requesting a guarantor or employer reference letter confirming income trajectory.`,
    }
  }

  if (q.includes('tom') || q.includes('richards')) {
    return {
      content: `**Tom Richards** — NB Score: 31 (Flagged)\n\n` +
        `- **Status:** Flagged\n` +
        `- **Unit:** Interested in studio\n` +
        `- **Employer:** Previously at TechFlow Solutions (dissolved)\n` +
        `- **Credit:** Poor (CCJ registered March 2023)\n` +
        `- **Red Flags:** Company dissolved, CCJ, unverified income\n\n` +
        `**AI Assessment:** HIGH RISK. Multiple adverse indicators. Do not proceed without guarantor or 6+ months rent in advance. Previous landlord reference unavailable.`,
    }
  }

  if (q.includes('occupancy') || q.includes('unit') || q.includes('availability') || q.includes('building')) {
    return {
      content: `**London Kensington — Building Overview:**\n\n` +
        `| Metric | Value |\n` +
        `|---|---|\n` +
        `| Total units | 70 |\n` +
        `| Occupied | 60 |\n` +
        `| Available | 10 |\n` +
        `| Occupancy rate | 85.7% |\n\n` +
        `**Available units:**\n` +
        `- 3x Studios (from £1,500 PCM)\n` +
        `- 4x 1-bed (from £1,850 PCM)\n` +
        `- 2x 2-bed (from £2,800 PCM)\n` +
        `- 1x 3-bed (£3,800 PCM)\n\n` +
        `At current letting velocity, estimated to reach 90% occupancy within 6 weeks.`,
    }
  }

  if (q.includes('score') || q.includes('nb score') || q.includes('scoring')) {
    return {
      content: `**NB Score** is Naybourhood's AI-powered tenant quality score (0-100) that combines:\n\n` +
        `- **Quality Score** — Tenant's financial strength, credit history, verification status\n` +
        `- **Intent Score** — How ready they are to rent (viewing completed, documents submitted)\n` +
        `- **Affordability Score** — Rent-to-income ratio, DTI analysis\n\n` +
        `**Your portfolio breakdown:**\n` +
        `- Score 80+ (Priority): 3 applicants — issue offers\n` +
        `- Score 60-79 (Qualified): 18 applicants — progress through verification\n` +
        `- Score 40-59 (Needs Review): 24 applicants — more info needed\n` +
        `- Score <40 (Flagged): 15 applicants — high risk, additional checks required\n\n` +
        `Average NB Score across your pipeline is **64**.`,
    }
  }

  // Default response
  return {
    content: `Based on your Aroundtown Kensington portfolio:\n\n` +
      `- **60 enquirers** across 10 available units\n` +
      `- **12 priority applicants** with an average NB Score of 64\n` +
      `- **85.7% occupancy** (60/70 units let)\n` +
      `- Your strongest applicants are Marcus Weber (Score 92, verified) and Sophie Chen (Score 88, viewing complete)\n\n` +
      `**I can help you with:**\n` +
      `- Compiled lists of applicants by status, score, or unit\n` +
      `- Send follow-up messages to specific applicant segments\n` +
      `- Run credit checks and reference verification\n` +
      `- Daily verification reports on all tenants\n` +
      `- Pipeline analysis and recommendations\n\n` +
      `What would you like me to do?`,
  }
}

export function GcpDemoAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your NB AI assistant. I can give you detailed insights on your tenants, run verification checks, compile reports, and take actions across your Aroundtown Kensington portfolio. What would you like to do?`,
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

    const response = getDemoResponse(message)
    setMessages((prev) => [...prev, { role: 'assistant', content: response.content, isAction: response.isAction }])
    setIsTyping(false)
  }

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
              {SUGGESTED_QUESTIONS.map((q) => (
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
                placeholder="Ask about tenants, run checks, generate reports..."
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
