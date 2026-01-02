'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { Heart, Phone, Mail, FileText, MapPin } from 'lucide-react'

export default function MatchesPage() {
  const { leads } = useData()
  const matches = leads.slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">My Matches</h2>
        <p className="text-sm text-muted-foreground">Clients matched to your services</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {matches.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{lead.full_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {lead.location || 'London'}
                    </div>
                  </div>
                </div>
                <Badge variant="success">New Lead</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Amount Needed</div>
                  <div className="font-medium text-sm">{lead.budget || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Timeline</div>
                  <div className="font-medium text-sm">{lead.timeline || 'N/A'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
