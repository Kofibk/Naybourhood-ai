import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/components';
import { useData } from '@/contexts/DataContext';
import { 
  Search, Filter, Download, Plus, Phone, Mail, 
  MessageCircle, Calendar, Eye, MoreVertical,
  Flame, Star, Zap, CheckCircle, Snowflake
} from 'lucide-react';

const statusColors: Record<string, string> = {
  'Hot': 'destructive',
  'Viewing Booked': 'warning',
  'Engaged': 'success',
  'New': 'secondary',
  'Cold': 'muted',
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-muted-foreground';
};

const getClassificationIcon = (quality: number, intent: number) => {
  const avg = (quality + intent) / 2;
  if (avg >= 85) return { icon: Flame, color: 'text-red-500', label: 'Hot' };
  if (quality >= 75) return { icon: Star, color: 'text-yellow-500', label: 'Quality' };
  if (intent >= 75) return { icon: Zap, color: 'text-blue-500', label: 'High Intent' };
  if (avg >= 50) return { icon: CheckCircle, color: 'text-green-500', label: 'Valid' };
  return { icon: Snowflake, color: 'text-gray-500', label: 'Cold' };
};

export default function LeadsPage() {
  const { leads } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'hot') return matchesSearch && lead.qualityScore >= 85;
    if (selectedTab === 'engaged') return matchesSearch && lead.status === 'Engaged';
    if (selectedTab === 'new') return matchesSearch && lead.status === 'New';
    return matchesSearch;
  });

  return (
    <DashboardLayout title="Leads" userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All ({leads.length})</TabsTrigger>
            <TabsTrigger value="hot">Hot ({leads.filter(l => l.qualityScore >= 85).length})</TabsTrigger>
            <TabsTrigger value="engaged">Engaged ({leads.filter(l => l.status === 'Engaged').length})</TabsTrigger>
            <TabsTrigger value="new">New ({leads.filter(l => l.status === 'New').length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Lead</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Campaign</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Budget</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground">Scores</th>
                    <th className="text-left p-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="text-right p-4 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const classification = getClassificationIcon(lead.qualityScore, lead.intentScore);
                    const ClassIcon = classification.icon;
                    return (
                      <tr key={lead.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-muted ${classification.color}`}>
                              <ClassIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm">{lead.campaign}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <span className="text-sm">{lead.budget}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${getScoreColor(lead.qualityScore)}`}>
                              Q:{lead.qualityScore}
                            </span>
                            <span className={`text-xs font-medium ${getScoreColor(lead.intentScore)}`}>
                              I:{lead.intentScore}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <Badge variant={statusColors[lead.status] as any || 'secondary'}>
                            {lead.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leads.length}</div>
              <div className="text-xs text-muted-foreground">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">
                {leads.filter(l => l.qualityScore >= 85).length}
              </div>
              <div className="text-xs text-muted-foreground">Hot Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">
                {Math.round(leads.reduce((acc, l) => acc + l.qualityScore, 0) / leads.length)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Quality Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(leads.reduce((acc, l) => acc + l.intentScore, 0) / leads.length)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Intent Score</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
