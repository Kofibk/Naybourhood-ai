'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CodeBlock } from './CodeBlock'
import { EndpointSection } from './EndpointSection'
import {
  Key,
  Shield,
  Zap,
  AlertTriangle,
  Clock,
  BookOpen,
} from 'lucide-react'

export function ApiDocsContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <Badge variant="outline">v1</Badge>
        </div>
        <h1 className="text-3xl font-bold font-display">Naybourhood Scoring API</h1>
        <p className="text-muted-foreground mt-2">
          Programmatic access to the Naybourhood AI lead scoring engine.
          Score leads, process batches, and receive webhooks.
        </p>
      </div>

      {/* Base URL */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Base URL</p>
          <code className="text-sm font-mono">
            https://app.naybourhood.ai/api/v1
          </code>
        </CardContent>
      </Card>

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Key className="h-5 w-5" />
          Authentication
        </h2>
        <p className="text-sm text-muted-foreground">
          All API requests require a Bearer token. Create API keys in your
          dashboard under <strong>Settings &rarr; API Keys</strong>.
        </p>
        <CodeBlock
          code={`curl -X POST https://app.naybourhood.ai/api/v1/score \\
  -H "Authorization: Bearer nb_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"lead": {"full_name": "John Smith", "email": "john@example.com"}}'`}
          language="bash"
        />
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-200">
            API keys are shown once at creation. Store them securely.
            Never expose keys in client-side code.
          </p>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Rate Limits
        </h2>
        <p className="text-sm text-muted-foreground">
          Default: <strong>60 requests/minute</strong> per API key.
          Rate limit info is returned in response headers.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium">Response Headers</p>
              <code className="text-xs font-mono text-muted-foreground block mt-1">
                X-RateLimit-Remaining: 58
              </code>
              <code className="text-xs font-mono text-muted-foreground block">
                X-Response-Time: 45ms
              </code>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium">429 Too Many Requests</p>
              <code className="text-xs font-mono text-muted-foreground block mt-1">
                {`{"error": "Rate limit exceeded..."}`}
              </code>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Endpoints
        </h2>

        {/* Score Single */}
        <EndpointSection
          method="POST"
          path="/api/v1/score"
          description="Score a single lead using the Naybourhood AI scoring engine. Pass either a buyer_id to score an existing lead, or inline lead data."
          requestBody={`{
  "lead": {
    "full_name": "Sarah Chen",
    "email": "sarah@example.com",
    "phone": "+44 7700 900000",
    "budget": "500000",
    "payment_method": "mortgage",
    "timeline": "3 months",
    "purpose": "primary residence",
    "location": "London",
    "bedrooms": 2
  }
}`}
          responseBody={`{
  "quality_score": 55,
  "intent_score": 45,
  "confidence_score": 75,
  "classification": "Nurture",
  "call_priority": 4,
  "call_priority_reason": "Nurture Lead - Scheduled Follow-up",
  "response_time": "Within 48 hours",
  "is_28_day_buyer": false,
  "is_fake_lead": false,
  "risk_flags": ["Mortgage not yet approved"],
  "score_breakdown": { ... }
}`}
          notes={[
            'Alternatively pass {"buyer_id": "uuid"} to score an existing lead in your account.',
            'Classification values: Hot Lead, Qualified, Needs Qualification, Nurture, Low Priority, Disqualified.',
          ]}
        />

        {/* Score Batch */}
        <EndpointSection
          method="POST"
          path="/api/v1/score/batch"
          description="Score up to 50 leads in a single request. Pass either an array of buyer_ids or inline lead objects."
          requestBody={`{
  "leads": [
    {
      "full_name": "Lead One",
      "email": "one@example.com",
      "budget": "750000",
      "payment_method": "cash",
      "timeline": "immediate"
    },
    {
      "full_name": "Lead Two",
      "email": "two@example.com",
      "budget": "300000",
      "timeline": "6 months"
    }
  ]
}`}
          responseBody={`{
  "total": 2,
  "scored": 2,
  "failed": 0,
  "results": [
    {
      "index": 0,
      "quality_score": 40,
      "intent_score": 50,
      "confidence_score": 50,
      "classification": "Needs Qualification",
      "call_priority": 3,
      "is_28_day_buyer": true,
      "is_fake_lead": false,
      "risk_flags": []
    },
    ...
  ]
}`}
          notes={[
            'Maximum 50 leads per batch request.',
            'Alternatively pass {"buyer_ids": ["uuid1", "uuid2"]} to score existing leads.',
          ]}
        />

        {/* Webhook */}
        <EndpointSection
          method="POST"
          path="/api/v1/webhook/lead-created"
          description="Receive a new lead from your CRM. The lead is created, auto-scored, and optionally pushed to HubSpot if configured."
          requestBody={`{
  "lead": {
    "full_name": "James Wilson",
    "email": "james@buyer.com",
    "phone": "+44 7700 900001",
    "budget": "1200000",
    "payment_method": "cash",
    "timeline": "28 days",
    "purpose": "investment",
    "source": "Rightmove",
    "location": "Manchester",
    "bedrooms": 3,
    "notes": "Interested in new build apartments"
  }
}`}
          responseBody={`{
  "success": true,
  "buyer_id": "uuid-of-new-lead",
  "scoring": {
    "quality_score": 40,
    "intent_score": 50,
    "confidence_score": 70,
    "classification": "Hot Lead",
    "call_priority": 1,
    "is_28_day_buyer": true,
    "is_fake_lead": false
  },
  "hubspot": {
    "pushed": true,
    "hubspot_id": "12345"
  }
}`}
          notes={[
            'Lead is automatically inserted and scored.',
            'HubSpot push only occurs if your company has a HubSpot API key configured.',
          ]}
        />
      </section>

      {/* Error Codes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Error Codes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Meaning</th>
                <th className="text-left py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-4"><Badge variant="outline">400</Badge></td>
                <td className="py-3 px-4 text-muted-foreground">Bad Request</td>
                <td className="py-3 px-4 text-muted-foreground">Check request body format</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4"><Badge variant="outline">401</Badge></td>
                <td className="py-3 px-4 text-muted-foreground">Unauthorized</td>
                <td className="py-3 px-4 text-muted-foreground">Check API key is valid and active</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4"><Badge variant="outline">403</Badge></td>
                <td className="py-3 px-4 text-muted-foreground">Forbidden</td>
                <td className="py-3 px-4 text-muted-foreground">API key lacks required permission</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4"><Badge variant="outline">404</Badge></td>
                <td className="py-3 px-4 text-muted-foreground">Not Found</td>
                <td className="py-3 px-4 text-muted-foreground">Buyer ID does not exist or not in your company</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4"><Badge variant="outline">429</Badge></td>
                <td className="py-3 px-4 text-muted-foreground">Rate Limited</td>
                <td className="py-3 px-4 text-muted-foreground">Wait and retry. Default: 60 req/min</td>
              </tr>
              <tr>
                <td className="py-3 px-4"><Badge variant="outline">500</Badge></td>
                <td className="py-3 px-4 text-muted-foreground">Server Error</td>
                <td className="py-3 px-4 text-muted-foreground">Retry with exponential backoff</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scoring Guide */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Scoring Classifications
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Hot Lead', desc: '28-day buyer OR quality/intent >= 70', color: 'text-red-400' },
            { name: 'Qualified', desc: 'Quality >= 60, intent >= 50', color: 'text-amber-400' },
            { name: 'Needs Qualification', desc: 'Confidence < 50, missing data', color: 'text-yellow-400' },
            { name: 'Nurture', desc: 'Good quality but low intent', color: 'text-blue-400' },
            { name: 'Low Priority', desc: 'Quality < 40 or flagged low urgency', color: 'text-gray-400' },
            { name: 'Disqualified', desc: 'Fake lead or data mismatch', color: 'text-red-600' },
          ].map(c => (
            <Card key={c.name}>
              <CardContent className="p-4">
                <p className={`font-medium ${c.color}`}>{c.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-8 border-t border-border">
        <p>Naybourhood Scoring API v1</p>
        <p className="mt-1">
          Questions? Contact{' '}
          <a href="mailto:support@naybourhood.ai" className="text-primary hover:underline">
            support@naybourhood.ai
          </a>
        </p>
      </div>
    </div>
  )
}
