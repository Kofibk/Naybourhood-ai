// Demo Data for Naybourhood App

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  timeline: string;
  source: string;
  campaign: string;
  status: string;
  qualityScore: number;
  intentScore: number;
  createdAt: string;
  lastContact?: string;
  notes?: string;
}

export interface Campaign {
  id: string;
  name: string;
  client: string;
  platform: string;
  status: 'active' | 'paused' | 'completed';
  spend: number;
  leads: number;
  cpl: number;
  impressions: number;
  clicks: number;
  ctr: number;
  startDate: string;
  endDate?: string;
}

export interface Company {
  id: string;
  name: string;
  type: 'developer' | 'agent' | 'broker';
  logo?: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  campaigns: number;
  totalSpend: number;
  totalLeads: number;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'agent' | 'broker';
  company?: string;
  avatar?: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

export const demoLeads: Lead[] = [
  { id: 'L001', name: 'James Chen', email: 'james.chen@email.com', phone: '+44 7700 900123', budget: '£800k-1M', timeline: 'Within 28 days', source: 'Meta Ads', campaign: 'Berkeley Syon Lane', status: 'Hot', qualityScore: 92, intentScore: 88, createdAt: '2024-12-28', lastContact: '2024-12-30', notes: 'Cash buyer, very interested in 2-bed units' },
  { id: 'L002', name: 'Sarah Williams', email: 'sarah.w@email.com', phone: '+44 7700 900456', budget: '£500k-600k', timeline: '0-3 months', source: 'Meta Ads', campaign: 'Berkeley Syon Lane', status: 'Viewing Booked', qualityScore: 85, intentScore: 91, createdAt: '2024-12-27', lastContact: '2024-12-29' },
  { id: 'L003', name: 'Mohammed Al-Rashid', email: 'm.alrashid@email.com', phone: '+44 7700 900789', budget: '£1.5M+', timeline: '0-3 months', source: 'Google Ads', campaign: 'Regal London W1', status: 'Hot', qualityScore: 95, intentScore: 78, createdAt: '2024-12-26', notes: 'Investor, interested in multiple units' },
  { id: 'L004', name: 'Emma Thompson', email: 'emma.t@email.com', phone: '+44 7700 900321', budget: '£400k-500k', timeline: '3-6 months', source: 'Meta Ads', campaign: 'Mount Anvil', status: 'Engaged', qualityScore: 72, intentScore: 65, createdAt: '2024-12-25' },
  { id: 'L005', name: 'David Park', email: 'david.park@email.com', phone: '+44 7700 900654', budget: '£600k-800k', timeline: 'Within 28 days', source: 'Direct', campaign: 'JLL Commercial', status: 'Viewing Booked', qualityScore: 88, intentScore: 85, createdAt: '2024-12-24' },
  { id: 'L006', name: 'Lisa Martinez', email: 'lisa.m@email.com', phone: '+44 7700 900987', budget: '£300k-400k', timeline: '6-9 months', source: 'Referral', campaign: 'Hadley Property', status: 'New', qualityScore: 58, intentScore: 42, createdAt: '2024-12-23' },
  { id: 'L007', name: 'Robert Johnson', email: 'r.johnson@email.com', phone: '+44 7700 900147', budget: '£700k-900k', timeline: '0-3 months', source: 'Meta Ads', campaign: 'Berkeley Syon Lane', status: 'Engaged', qualityScore: 78, intentScore: 72, createdAt: '2024-12-22' },
  { id: 'L008', name: 'Priya Sharma', email: 'priya.s@email.com', phone: '+44 7700 900258', budget: '£450k-550k', timeline: 'Within 28 days', source: 'Google Ads', campaign: 'London Square', status: 'Hot', qualityScore: 89, intentScore: 92, createdAt: '2024-12-21' },
  { id: 'L009', name: 'Michael Brown', email: 'm.brown@email.com', phone: '+44 7700 900369', budget: '£1M-1.5M', timeline: '3-6 months', source: 'Meta Ads', campaign: 'Regal London W1', status: 'Viewing Booked', qualityScore: 82, intentScore: 68, createdAt: '2024-12-20' },
  { id: 'L010', name: 'Jennifer Lee', email: 'jen.lee@email.com', phone: '+44 7700 900741', budget: '£350k-450k', timeline: '9-12 months', source: 'Organic', campaign: 'Mount Anvil', status: 'Cold', qualityScore: 45, intentScore: 35, createdAt: '2024-12-19' },
  { id: 'L011', name: 'Alexander Wright', email: 'a.wright@email.com', phone: '+44 7700 900852', budget: '£2M+', timeline: 'Within 28 days', source: 'Direct', campaign: 'Berkeley Group', status: 'Hot', qualityScore: 96, intentScore: 94, createdAt: '2024-12-18', notes: 'VIP client, cash buyer' },
  { id: 'L012', name: 'Sophie Turner', email: 'sophie.t@email.com', phone: '+44 7700 900963', budget: '£550k-650k', timeline: '0-3 months', source: 'Meta Ads', campaign: 'Hadley Property', status: 'Engaged', qualityScore: 75, intentScore: 70, createdAt: '2024-12-17' },
];

export const demoCampaigns: Campaign[] = [
  { id: 'C001', name: 'Berkeley Syon Lane - Q4', client: 'Berkeley Group', platform: 'Meta Ads', status: 'active', spend: 8500, leads: 235, cpl: 18, impressions: 4500000, clicks: 45000, ctr: 1.0, startDate: '2024-10-01' },
  { id: 'C002', name: 'Regal London W1 Launch', client: 'Regal London', platform: 'Meta Ads', status: 'active', spend: 6200, leads: 189, cpl: 24, impressions: 3200000, clicks: 38000, ctr: 1.19, startDate: '2024-11-01' },
  { id: 'C003', name: 'JLL Commercial Q4', client: 'JLL', platform: 'Google Ads', status: 'active', spend: 5800, leads: 156, cpl: 28, impressions: 2800000, clicks: 28000, ctr: 1.0, startDate: '2024-10-15' },
  { id: 'C004', name: 'Mount Anvil Battersea', client: 'Mount Anvil', platform: 'Meta Ads', status: 'active', spend: 4200, leads: 134, cpl: 32, impressions: 2100000, clicks: 21000, ctr: 1.0, startDate: '2024-11-15' },
  { id: 'C005', name: 'Hadley Property SE1', client: 'Hadley Property Group', platform: 'Meta Ads', status: 'active', spend: 3800, leads: 98, cpl: 42, impressions: 1900000, clicks: 19000, ctr: 1.0, startDate: '2024-12-01' },
  { id: 'C006', name: 'London Square E14', client: 'London Square', platform: 'Google Ads', status: 'active', spend: 3200, leads: 87, cpl: 37, impressions: 1600000, clicks: 16000, ctr: 1.0, startDate: '2024-11-20' },
  { id: 'C007', name: 'Tudor Financial (Wix)', client: 'Tudor Financial', platform: 'Meta Ads', status: 'paused', spend: 2400, leads: 15, cpl: 156, impressions: 800000, clicks: 8000, ctr: 1.0, startDate: '2024-12-10' },
  { id: 'C008', name: 'Barratt Homes Essex', client: 'Barratt Homes', platform: 'Meta Ads', status: 'completed', spend: 7500, leads: 312, cpl: 24, impressions: 3800000, clicks: 42000, ctr: 1.1, startDate: '2024-09-01', endDate: '2024-11-30' },
];

export const demoCompanies: Company[] = [
  { id: 'CO001', name: 'Berkeley Group', type: 'developer', contactName: 'John Smith', contactEmail: 'john.smith@berkeley.co.uk', phone: '+44 20 7123 4567', campaigns: 8, totalSpend: 45000, totalLeads: 892, status: 'active', joinedDate: '2024-01-15' },
  { id: 'CO002', name: 'Regal London', type: 'developer', contactName: 'Sarah Johnson', contactEmail: 's.johnson@regallondon.co.uk', phone: '+44 20 7234 5678', campaigns: 5, totalSpend: 28000, totalLeads: 534, status: 'active', joinedDate: '2024-03-20' },
  { id: 'CO003', name: 'JLL', type: 'agent', contactName: 'Michael Davies', contactEmail: 'm.davies@jll.com', phone: '+44 20 7345 6789', campaigns: 12, totalSpend: 65000, totalLeads: 1245, status: 'active', joinedDate: '2023-09-10' },
  { id: 'CO004', name: 'Mount Anvil', type: 'developer', contactName: 'Emma Wilson', contactEmail: 'e.wilson@mountanvil.com', phone: '+44 20 7456 7890', campaigns: 4, totalSpend: 18000, totalLeads: 312, status: 'active', joinedDate: '2024-06-01' },
  { id: 'CO005', name: 'Hadley Property Group', type: 'developer', contactName: 'David Brown', contactEmail: 'd.brown@hadley.co.uk', phone: '+44 20 7567 8901', campaigns: 3, totalSpend: 12000, totalLeads: 198, status: 'active', joinedDate: '2024-08-15' },
  { id: 'CO006', name: 'Tudor Financial', type: 'broker', contactName: 'Lisa Green', contactEmail: 'l.green@tudor.co.uk', phone: '+44 20 7678 9012', campaigns: 2, totalSpend: 5000, totalLeads: 45, status: 'inactive', joinedDate: '2024-10-01' },
];

export const demoUsers: User[] = [
  { id: 'U001', name: 'Kofi Mensah', email: 'kofi@naybourhood.ai', role: 'admin', lastActive: '2024-12-31', status: 'active' },
  { id: 'U002', name: 'Ahmad Patel', email: 'ahmad@naybourhood.ai', role: 'admin', lastActive: '2024-12-31', status: 'active' },
  { id: 'U003', name: 'John Smith', email: 'john.smith@berkeley.co.uk', role: 'developer', company: 'Berkeley Group', lastActive: '2024-12-30', status: 'active' },
  { id: 'U004', name: 'Sarah Johnson', email: 's.johnson@regallondon.co.uk', role: 'developer', company: 'Regal London', lastActive: '2024-12-29', status: 'active' },
  { id: 'U005', name: 'Michael Davies', email: 'm.davies@jll.com', role: 'agent', company: 'JLL', lastActive: '2024-12-31', status: 'active' },
  { id: 'U006', name: 'Lisa Green', email: 'l.green@tudor.co.uk', role: 'broker', company: 'Tudor Financial', lastActive: '2024-12-15', status: 'inactive' },
];

// Dashboard metrics
export const dashboardMetrics = {
  totalLeads: 1543,
  hotLeads: 465,
  avgScore: 72,
  totalSpend: 34536,
  avgCPL: 22,
  qualifiedRate: 76,
  totalCampaigns: 57,
  activeCampaigns: 6,
  totalCompanies: 12,
  totalUsers: 24,
};

// Classification breakdown
export const leadClassifications = {
  hot: 465,
  star: 312,
  lightning: 289,
  valid: 418,
  cold: 59,
};

// Funnel data
export const funnelData = [
  { name: 'New', value: 892, color: '#ffffff' },
  { name: 'Engaged', value: 534, color: '#a855f7' },
  { name: 'Viewing', value: 312, color: '#f59e0b' },
  { name: 'Offer', value: 89, color: '#22c55e' },
  { name: 'Won', value: 42, color: '#15803d' },
];

// Timeline data
export const timelineData = [
  { date: '1 Dec', leads: 234 },
  { date: '8 Dec', leads: 312 },
  { date: '15 Dec', leads: 389 },
  { date: '22 Dec', leads: 456 },
  { date: '29 Dec', leads: 523 },
];

// Source breakdown
export const sourceData = [
  { name: 'Meta Ads', value: 612 },
  { name: 'Google Ads', value: 389 },
  { name: 'Direct', value: 234 },
  { name: 'Referral', value: 187 },
  { name: 'Organic', value: 121 },
];

// AI Recommendations
export const aiRecommendations = [
  'Pause Tudor Financial campaigns - CPL £156 vs target £35. Potential monthly savings: £2,400',
  'Scale Berkeley Group budget by 20% - strong ROI at £18 CPL with 235 leads generated',
  'Follow up with 12 hot leads who viewed pricing in last 48 hours',
  'James Chen (Q:92, I:88) ready to purchase within 28 days - schedule viewing call',
];

// Campaign alerts
export const campaignAlerts = [
  { id: 'A001', campaign: 'Tudor Financial (Wix)', currentCPL: 156, targetCPL: 35, recommendation: 'Pause and reallocate budget', savings: 2400 },
  { id: 'A002', campaign: 'Hadley Property Group', currentCPL: 42, targetCPL: 35, recommendation: 'Consider creative refresh' },
];

// Action leads (high priority)
export const actionLeads = demoLeads.filter(l => l.qualityScore >= 85 || l.intentScore >= 85).slice(0, 5);
