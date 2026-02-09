'use client'

import { Badge } from '@/components/ui/badge'
import { CodeBlock } from './CodeBlock'

interface EndpointSectionProps {
  method: string
  path: string
  description: string
  requestBody?: string
  responseBody: string
  notes?: string[]
}

function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    GET: 'bg-green-600 text-white',
    POST: 'bg-blue-600 text-white',
    PUT: 'bg-amber-600 text-white',
    DELETE: 'bg-red-600 text-white',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${colorMap[method] || 'bg-gray-600 text-white'}`}>
      {method}
    </span>
  )
}

export function EndpointSection({
  method,
  path,
  description,
  requestBody,
  responseBody,
  notes,
}: EndpointSectionProps) {
  return (
    <div className="space-y-4 p-6 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 flex-wrap">
        <MethodBadge method={method} />
        <code className="text-sm font-mono font-medium">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>

      {requestBody && (
        <div>
          <h4 className="text-sm font-medium mb-2">Request Body</h4>
          <CodeBlock code={requestBody} language="json" />
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium mb-2">Response</h4>
        <CodeBlock code={responseBody} language="json" />
      </div>

      {notes && notes.length > 0 && (
        <div className="text-sm text-muted-foreground space-y-1">
          {notes.map((note, i) => (
            <p key={i}>* {note}</p>
          ))}
        </div>
      )}
    </div>
  )
}
