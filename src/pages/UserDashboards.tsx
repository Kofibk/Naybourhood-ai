import { DashboardLayout } from '@/components/DashboardLayout';
import { AIChat } from '@/components/AIChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { getGreeting, getDateString } from '@/lib/utils';
import { 
  Users, Flame, Target, Calendar, MessageSquare, 
  TrendingUp, Eye, Phone, Heart, Sparkles
} from 'lucide-react';

// Shared dashboard component for Developer/Agent/Broker
interface UserDashboardProps {
  userType: 'developer' | 'agent' | 'broker';
}

export function UserDashboard({ userType }: UserDashboardProps) {
  const { user } = useAuth();
  const { leads } = useData();
  const userName = user?.name?.split(' ')[0] || 'there';

  const config = {
    developer: {
      title: 'Buyers',
      metricLabel: 'Active Buyers',
      icon: Users,
    },
    agent: {
      title: 'Leads',
      metricLabel: 'Active Leads',
      icon: Users,
    },
    broker: {
      title: 'Clients',
      metricLabel: 'Active Clients',
      icon: Users,
    },
  }[userType];

  const hotLeads = leads.filter(l => l.qualityScore >= 85).slice(0, 3);

  return (
    <DashboardLayout title={`Welcome back, ${userName}`} userType={userType}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold font-display">{getGreeting()}, {userName}</h2>
          <p className="text-sm text-muted-foreground">{getDateString()}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <config.icon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="success" className="text-[10px]">+12%</Badge>
              </div>
              <div className="text-2xl font-bold">{leads.length}</div>
              <div className="text-xs text-muted-foreground">{config.metricLabel}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <Badge variant="warning" className="text-[10px]">Priority</Badge>
              </div>
              <div className="text-2xl font-bold text-orange-500">
                {leads.filter(l => l.qualityScore >= 85).length}
              </div>
              <div className="text-xs text-muted-foreground">Hot {config.title}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-xs text-muted-foreground">Viewings This Week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-xs text-muted-foreground">Unread Messages</div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Priority {config.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hotLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.budget} • {lead.timeline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="muted" className="text-[10px]">Q:{lead.qualityScore}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2">
              View All {config.title}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">View {config.title}</p>
                <p className="text-xs text-muted-foreground">Browse all {config.title.toLowerCase()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Conversations</p>
                <p className="text-xs text-muted-foreground">3 unread messages</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">My Matches</p>
                <p className="text-xs text-muted-foreground">12 matched {config.title.toLowerCase()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">AI Insights</p>
                <p className="text-xs text-muted-foreground">Get recommendations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">New lead:</span>
              <span className="font-medium">James Chen</span>
              <span className="text-muted-foreground ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">Viewing booked:</span>
              <span className="font-medium">Sarah Williams</span>
              <span className="text-muted-foreground ml-auto">5 hours ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Message received:</span>
              <span className="font-medium">David Park</span>
              <span className="text-muted-foreground ml-auto">1 day ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <AIChat />
    </DashboardLayout>
  );
}

// Export individual dashboards
export function DeveloperDashboard() {
  return <UserDashboard userType="developer" />;
}

export function AgentDashboard() {
  return <UserDashboard userType="agent" />;
}

export function BrokerDashboard() {
  return <UserDashboard userType="broker" />;
}
