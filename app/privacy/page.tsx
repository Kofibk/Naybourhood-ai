import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">Back to Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl font-semibold mb-8">Privacy Policy</h1>
        <p className="text-white/50 text-sm mb-12">Last updated: February 2026</p>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-white mb-3">1. Data We Collect</h2>
            <p>We collect information you provide when creating an account (name, email, company), buyer/lead data you upload or enter into the platform, and usage data such as page views and feature interactions.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">2. How We Use Your Data</h2>
            <p>We use your data to provide the Naybourhood platform services, including AI-powered buyer scoring, lead management, and analytics. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">3. Data Storage & Security</h2>
            <p>Data is stored securely using Supabase (PostgreSQL) with row-level security policies. All data is encrypted in transit (TLS) and at rest. Authentication is handled through Supabase Auth with industry-standard protocols.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase</strong> — Database and authentication</li>
              <li><strong>Stripe</strong> — Payment processing</li>
              <li><strong>Anthropic</strong> — AI-powered buyer scoring and analysis</li>
              <li><strong>Vercel</strong> — Application hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account, we remove your personal data within 30 days. Anonymised aggregate data may be retained for analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You can export your data at any time through the platform settings. To exercise these rights, contact us at privacy@naybourhood.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-white mb-3">8. Contact</h2>
            <p>For privacy enquiries, contact us at <a href="mailto:privacy@naybourhood.com" className="text-[#34D399] hover:underline">privacy@naybourhood.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
