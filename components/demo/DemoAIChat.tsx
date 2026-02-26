'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'Who are my hottest leads right now?',
  'How are my campaigns performing?',
  'Which development has the most availability?',
  'Summarise my pipeline',
]

/** Simple pattern-based responses using demo data context */
function getDemoResponse(question: string): string {
  const q = question.toLowerCase()

  if (q.includes('hot') && (q.includes('lead') || q.includes('buyer'))) {
    return `You currently have **92 hot leads** out of 847 total. Your top performers right now:\n\n` +
      `1. **Emily Thornton** (NB Score: 93) — Negotiating on Dollar Bay 3-bed. Mortgage AIP secured at £1.8M, solicitor instructed. Very high conversion probability.\n` +
      `2. **James Richardson** (NB Score: 91) — Viewing booked at Keybridge Lofts penthouse. Cash buyer, £2.8M budget.\n` +
      `3. **Sarah Chen** (NB Score: 86) — HK investor, £4-6M budget, proof of funds verified. Interested in Keybridge Lofts.\n\n` +
      `I'd recommend prioritising Emily Thornton — she's furthest along in the pipeline and ready to reserve.`
  }

  if (q.includes('campaign') || q.includes('spend') || q.includes('cpl') || q.includes('marketing')) {
    return `Here's your campaign overview:\n\n` +
      `**Total spend:** £184,500 across 7 active campaigns\n` +
      `**Total leads generated:** 847\n` +
      `**Average CPL:** £218\n\n` +
      `**Top performers:**\n` +
      `- Dollar Bay — Rightmove Featured: £144 CPL (best performer)\n` +
      `- Royal Eden Docks — Meta International: £204 CPL\n` +
      `- Dollar Bay — Meta UK: £227 CPL\n\n` +
      `**Recommendation:** The Rightmove Featured campaign is outperforming Meta by 37% on CPL. Consider reallocating budget from the Keybridge Lofts Zoopla campaign (paused, £238 CPL) to Rightmove.`
  }

  if (q.includes('development') || q.includes('availability') || q.includes('units') || q.includes('sold')) {
    return `Here's your development portfolio:\n\n` +
      `| Development | Total | Available | Sold |\n` +
      `|---|---|---|---|\n` +
      `| Royal Eden Docks | 264 | 87 | 177 |\n` +
      `| Dockside | 186 | 186 | 0 (Coming Soon) |\n` +
      `| Keybridge Lofts | 415 | 41 | 374 (90% sold) |\n` +
      `| Dollar Bay | 128 | 23 | 105 |\n` +
      `| South Quay Plaza | 350 | 0 | 350 (Sold Out) |\n\n` +
      `**Royal Eden Docks** has the most availability with 87 units. **Keybridge Lofts** is nearly sold out — consider a "final units" push.`
  }

  if (q.includes('pipeline') || q.includes('summary') || q.includes('summarise') || q.includes('overview')) {
    return `**Mount Anvil Pipeline Summary:**\n\n` +
      `- **847** total leads in pipeline\n` +
      `- **92** hot leads (11% of total)\n` +
      `- **89** viewings booked\n` +
      `- **37** in negotiation\n` +
      `- **18** reserved\n` +
      `- **12** completed\n\n` +
      `**Conversion rate:** 1.4% (lead → completed)\n` +
      `**Avg NB Score:** 64\n\n` +
      `The pipeline is healthy with strong international interest. 147 leads are still awaiting first contact — prioritising those with NB Score 80+ could move 15-20 into the viewing stage this week.`
  }

  if (q.includes('james') || q.includes('richardson')) {
    return `**James Richardson** — NB Score: 91 (Hot Lead)\n\n` +
      `- **Status:** Viewing Booked\n` +
      `- **Budget:** £2.5M-£3.5M\n` +
      `- **Development:** Keybridge Lofts (penthouse)\n` +
      `- **Source:** Rightmove\n` +
      `- **Profile:** Verified cash buyer. Solicitor already instructed.\n\n` +
      `**AI Assessment:** Very high intent and quality scores. This buyer is ready to move quickly. Recommend ensuring the viewing experience is premium-level to convert.`
  }

  if (q.includes('emily') || q.includes('thornton')) {
    return `**Emily Thornton** — NB Score: 93 (Hot Lead)\n\n` +
      `- **Status:** Negotiating\n` +
      `- **Budget:** £1.5M-£2M\n` +
      `- **Development:** Dollar Bay (3-bed)\n` +
      `- **Source:** Website\n` +
      `- **Profile:** UK-based primary residence buyer. Mortgage AIP secured at £1.8M. Solicitor instructed. Offer already submitted.\n\n` +
      `**AI Assessment:** Highest conversion probability in your pipeline. Intent score 95/100. Follow up today to close.`
  }

  if (q.includes('sarah') || q.includes('chen')) {
    return `**Sarah Chen** — NB Score: 86 (Hot Lead)\n\n` +
      `- **Status:** Follow Up\n` +
      `- **Budget:** £4M-£6M\n` +
      `- **Development:** Keybridge Lofts\n` +
      `- **Source:** Referral\n` +
      `- **Profile:** Hong Kong-based investor. Proof of funds verified. Looking for 2+ bed Zone 1 investment. Ready within 28 days.\n\n` +
      `**AI Assessment:** High-value international investor. Book a video viewing this week to maintain momentum.`
  }

  if (q.includes('international') || q.includes('investor') || q.includes('overseas')) {
    return `You have strong international pipeline diversity:\n\n` +
      `- **Hong Kong:** Sarah Chen (£4-6M, Keybridge Lofts)\n` +
      `- **UAE:** Mohammed Al-Rashid (£6-8M, Keybridge Lofts)\n` +
      `- **Nigeria:** Michael Okonkwo (£1.8-2.2M, Royal Eden Docks)\n` +
      `- **Germany:** Alexandra Muller (£2-3M, Dollar Bay)\n` +
      `- **India:** Priya Sharma (£1-2M, Keybridge Lofts)\n` +
      `- **Ghana:** David Osei (£500-750K, Royal Eden Docks)\n\n` +
      `International buyers represent 75% of your recent leads. The Meta International campaign at £204 CPL is driving strong results for Royal Eden Docks.`
  }

  if (q.includes('score') || q.includes('nb score') || q.includes('scoring')) {
    return `**NB Score** is Naybourhood's AI-powered lead quality score (0-100) that combines:\n\n` +
      `- **Quality Score** — Buyer's financial strength, verification status, budget\n` +
      `- **Intent Score** — How ready they are to buy (timeline, solicitor instructed, AIP status)\n` +
      `- **Confidence Score** — How reliable the data is\n\n` +
      `**Your portfolio breakdown:**\n` +
      `- Score 80+ (Hot): 92 leads — prioritise for immediate contact\n` +
      `- Score 60-79 (Qualified): 184 leads — nurture with viewings\n` +
      `- Score 40-59 (Needs Qual): 203 leads — more info needed\n` +
      `- Score <40 (Nurture): 246 leads — long-term pipeline\n\n` +
      `Average NB Score across your pipeline is **64**.`
  }

  // Default response
  return `Based on your Mount Anvil portfolio:\n\n` +
    `- **847 leads** across 5 developments (7 active campaigns)\n` +
    `- **92 hot leads** with an average NB Score of 64\n` +
    `- **£184,500** campaign spend generating leads at £218 avg CPL\n` +
    `- Your strongest leads are Emily Thornton (Score 93, negotiating) and James Richardson (Score 91, viewing booked)\n\n` +
    `Feel free to ask me about specific buyers, campaign metrics, development availability, or pipeline insights!`
}

export function DemoAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi Rowena! I'm your NB AI assistant. I can help you with anything about your Mount Anvil portfolio — buyers, campaigns, developments, pipeline metrics. What would you like to know?`,
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
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

    const response = getDemoResponse(message)
    setMessages((prev) => [...prev, { role: 'assistant', content: response }])
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
                      : 'bg-[#1A1A1A] text-white/80 border border-white/5 rounded-bl-sm'
                  }`}
                >
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
                placeholder="Ask about buyers, campaigns, developments..."
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
