import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AIChat } from '@/components/AIChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { getGreeting, getDateString, formatCurrency } from '@/lib/utils';
import { dashboardMetrics, leadClassifications, funnelData, timelineData, sourceData, aiRecommendations, campaignAlerts, actionLeads } from '@/lib/demoData';
import {
  Users, Flame, Target, PoundSterling, TrendingDown, CheckCircle,
  Lightbulb, AlertCircle, Phone, MessageCircle, Calendar,
  RefreshCw, Upload, Eye, Database
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';

const COLORS = {
  hot: '#ef4444',
  star: '#eab308',
  lightning: '#3b82f6',
  valid: '#22c55e',
  cold: '#6b7280',
};

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return count;
}

function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }: { 
  value: number; prefix?: string; suffix?: string; className?: string 
}) {
  const count = useAnimatedCounter(value);
  return <span className={className}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { leads, campaigns, isLoading, isAirtable, error, refreshData } = useData();
  const userName = user?.name?.split(' ')[0] || 'there';

  const classificationData = Object.entries(leadClassifications).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[name as keyof typeof COLORS],
  }));

  const campaignPerformance = campaigns.slice(0, 5).map(c => ({
    name: c.name.slice(0, 20),
    leads: c.leads,
    cpl: c.cpl,
  }));

  return (
    <DashboardLayout title={`Welcome back, ${userName}`} userType="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display">{getGreeting()}, {userName}</h2>
            <p className="text-sm text-muted-foreground">{getDateString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                Campaigns: {campaigns.length} · Leads: {leads.length}
              </p>
              <Badge variant={isAirtable ? "success" : "secondary"} className="text-[10px]">
                {isAirtable ? "Supabase" : "Demo Data"}
              </Badge>
              {error && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => refreshData()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Sync'}
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Total Leads</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <AnimatedNumber value={dashboardMetrics.totalLeads} className="text-2xl font-bold" />
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Hot Leads</span>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <AnimatedNumber value={dashboardMetrics.hotLeads} className="text-2xl font-bold text-orange-500" />
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Avg Score</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <AnimatedNumber value={dashboardMetrics.avgScore} className="text-2xl font-bold" />
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Total Spend</span>
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardMetrics.totalSpend)}
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Avg CPL</span>
                <TrendingDown className="h-4 w-4 text-success" />
              </div>
              <AnimatedNumber value={dashboardMetrics.avgCPL} prefix="£" className="text-2xl font-bold text-success" />
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Qualified Rate</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <AnimatedNumber value={dashboardMetrics.qualifiedRate} suffix="%" className="text-2xl font-bold text-success" />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lead Classification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lead Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={classificationData} cx="50%" cy="50%" innerRadius={25} outerRadius={50} dataKey="value">
                        {classificationData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {classificationData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnelData.map((stage, i) => {
                const maxValue = funnelData[0].value;
                const widthPercent = Math.max((stage.value / maxValue) * 100, 15);
                const prevValue = i > 0 ? funnelData[i - 1].value : stage.value;
                const rate = prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : 100;
                return (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-xs w-16 text-muted-foreground">{stage.name}</span>
                    <div className="flex-1">
                      <div
                        className="h-8 rounded flex items-center justify-end pr-3 transition-all"
                        style={{ width: `${widthPercent}%`, backgroundColor: stage.color }}
                      >
                        <span className="text-xs font-medium text-white">{stage.value}</span>
                      </div>
                    </div>
                    {i > 0 && (
                      <span className={`text-xs w-12 text-right ${rate >= 50 ? 'text-success' : 'text-warning'}`}>
                        {rate}%
                      </span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Campaign Performance */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={campaignPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="cpl" name="CPL (£)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                    {sourceData.map((_, i) => <Cell key={i} fill={['#ffffff', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7'][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Acquisition Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Action Required
              <Badge variant="destructive">{actionLeads.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionLeads.map((lead) => (
              <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{lead.name}</span>
                    <Badge variant="muted">{lead.budget}</Badge>
                    <Badge variant="warning">{lead.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Q: {lead.qualityScore}</span>
                    <span>I: {lead.intentScore}</span>
                    <span>{lead.timeline}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" className="h-8 w-8">
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campaign Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Campaign Alerts
              <Badge variant="warning">{campaignAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignAlerts.map((alert) => (
              <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{alert.campaign}</span>
                    <span className="text-destructive font-medium text-sm">CPL: £{alert.currentCPL}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.recommendation}. Target: £{alert.targetCPL}.
                    {alert.savings && <span className="text-success"> Save £{alert.savings}</span>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="success" className="bg-success hover:bg-success/90">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Apply
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <AIChat />
    </DashboardLayout>
  );
}
