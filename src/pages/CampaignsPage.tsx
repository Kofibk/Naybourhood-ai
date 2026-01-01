import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/components';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/lib/utils';
import { 
  Search, Filter, Plus, TrendingUp, TrendingDown, 
  Play, Pause, Eye, MoreVertical, BarChart3
} from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', variant: 'success' as const, icon: Play },
  paused: { label: 'Paused', variant: 'warning' as const, icon: Pause },
  completed: { label: 'Completed', variant: 'secondary' as const, icon: null },
};

export default function CampaignsPage() {
  const { campaigns } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    return matchesSearch && campaign.status === selectedTab;
  });

  const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
  const totalLeads = campaigns.reduce((acc, c) => acc + c.leads, 0);
  const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <DashboardLayout title="Campaigns" userType="admin">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{campaigns.length}</div>
              <div className="text-xs text-muted-foreground">Total Campaigns</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
              <div className="text-xs text-muted-foreground">Total Spend</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${avgCPL <= 35 ? 'text-success' : 'text-destructive'}`}>
                £{Math.round(avgCPL)}
              </div>
              <div className="text-xs text-muted-foreground">Avg CPL (target: £35)</div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({campaigns.filter(c => c.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({campaigns.filter(c => c.status === 'paused').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({campaigns.filter(c => c.status === 'completed').length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Campaigns Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => {
            const config = statusConfig[campaign.status];
            const cplStatus = campaign.cpl <= 35 ? 'success' : campaign.cpl <= 50 ? 'warning' : 'destructive';
            return (
              <Card key={campaign.id} className="hover:border-border/80 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-medium">{campaign.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{campaign.client}</p>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">{formatCurrency(campaign.spend)}</div>
                      <div className="text-[10px] text-muted-foreground">Spend</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{campaign.leads}</div>
                      <div className="text-[10px] text-muted-foreground">Leads</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold text-${cplStatus}`}>£{campaign.cpl}</div>
                      <div className="text-[10px] text-muted-foreground">CPL</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{campaign.platform}</span>
                    <div className="flex items-center gap-1">
                      {campaign.cpl <= 35 ? (
                        <TrendingDown className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingUp className="h-3 w-3 text-destructive" />
                      )}
                      <span>{campaign.ctr.toFixed(2)}% CTR</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <BarChart3 className="h-3.5 w-3.5 mr-1" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
