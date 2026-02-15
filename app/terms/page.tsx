import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">Back to Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl font-semibold mb-8">Terms of Service</h1>
        <p className="text-white/50 text-sm mb-12">Last updated: February 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Naybourhood, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">2. Description of Service</h2>
            <p>Naybourhood is a buyer intelligence platform for property professionals. It provides AI-powered lead scoring, buyer management, campaign analytics, and workflow tools for developers, estate agents, and mortgage brokers.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information and keep your account details up to date. You are responsible for all activity under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the platform to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Upload or process data you do not have the right to use</li>
              <li>Attempt to access other users&apos; data without authorisation</li>
              <li>Reverse-engineer or scrape the platform</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">5. Data Ownership</h2>
            <p>You retain ownership of all data you upload to Naybourhood. We do not claim ownership of your buyer data, lead information, or campaign data. We use your data solely to provide the platform services.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">6. AI Scoring Disclaimer</h2>
            <p>AI-generated scores, classifications, and recommendations are provided as decision-support tools and should not be the sole basis for business decisions. Naybourhood does not guarantee the accuracy of AI-generated outputs.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">7. Payment & Billing</h2>
            <p>Paid plans are billed through Stripe. You agree to pay all applicable fees. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are handled on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">8. Termination</h2>
            <p>Either party may terminate the agreement at any time. Upon termination, your access to the platform will be revoked and your data will be deleted within 30 days unless you request an export.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">9. Limitation of Liability</h2>
            <p>Naybourhood is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">10. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:legal@naybourhood.com" className="text-[#34D399] hover:underline">legal@naybourhood.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
