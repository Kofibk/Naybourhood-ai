-- Naybourhood Supabase Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable RLS
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- Users table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'developer', 'agent', 'broker')) default 'developer',
  company_id uuid,
  avatar_url text,
  last_active timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Companies table
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('Developer', 'Agent', 'Broker', 'Marketing Agency', 'Financial Advisor')),
  website text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text check (status in ('Active', 'Inactive', 'Pending')) default 'Active',
  -- Subscription/Billing fields
  subscription_tier text check (subscription_tier in ('starter', 'access', 'growth', 'enterprise')),
  subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'cancelled', 'none')),
  subscription_price numeric,
  billing_cycle text check (billing_cycle in ('monthly', 'annual')),
  next_billing_date date,
  -- Stripe integration
  stripe_customer_id text,
  stripe_subscription_id text,
  -- Stats
  ad_spend numeric default 0,
  total_leads integer default 0,
  campaign_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Campaigns table
create table if not exists public.campaigns (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  client text,
  development text,
  company_id uuid references public.companies(id),
  platform text check (platform in ('Meta', 'Google', 'TikTok', 'LinkedIn', 'Rightmove', 'Zoopla', 'Other')),
  status text check (status in ('active', 'paused', 'completed', 'draft')) default 'draft',
  spend numeric default 0,
  leads integer default 0,
  cpl numeric default 0,
  impressions integer default 0,
  clicks integer default 0,
  ctr numeric default 0,
  budget numeric,
  start_date date,
  end_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Buyers/Leads table
create table if not exists public.buyers (
  id uuid default gen_random_uuid() primary key,
  -- Name fields
  full_name text not null,
  first_name text,
  last_name text,
  -- Contact
  email text,
  phone text,
  -- Property requirements
  budget text,
  budget_min numeric,
  budget_max numeric,
  bedrooms integer,
  location text,
  area text,
  timeline text,
  -- Source tracking
  source text,
  campaign text,
  campaign_id uuid references public.campaigns(id),
  company_id uuid references public.companies(id),
  -- Status and scoring
  status text check (status in ('New', 'Contacted', 'Qualified', 'Viewing Booked', 'Offer Made', 'Completed', 'Lost', 'Documentation')) default 'New',
  quality_score integer check (quality_score >= 0 and quality_score <= 100),
  intent_score integer check (intent_score >= 0 and intent_score <= 100),
  -- Financial qualification
  payment_method text,
  proof_of_funds boolean default false,
  mortgage_status text,
  uk_broker boolean default false,
  uk_solicitor boolean default false,
  -- Notes and tags
  notes text,
  tags text[],
  -- Assignment
  assigned_to uuid references public.profiles(id),
  assigned_user text,
  assigned_user_name text,
  assigned_at timestamp with time zone,
  -- Timestamps
  last_contact timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Conversations/Messages table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references public.buyers(id) on delete cascade,
  channel text check (channel in ('email', 'whatsapp', 'sms', 'phone', 'in_person')),
  direction text check (direction in ('inbound', 'outbound')),
  content text,
  status text check (status in ('sent', 'delivered', 'read', 'replied')),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.campaigns enable row level security;
alter table public.buyers enable row level security;
alter table public.conversations enable row level security;

-- RLS Policies (allow authenticated users to read all, write own)
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Authenticated users can view companies" on public.companies for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert companies" on public.companies for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update companies" on public.companies for update using (auth.role() = 'authenticated');

create policy "Authenticated users can view campaigns" on public.campaigns for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert campaigns" on public.campaigns for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update campaigns" on public.campaigns for update using (auth.role() = 'authenticated');

create policy "Authenticated users can view buyers" on public.buyers for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert buyers" on public.buyers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update buyers" on public.buyers for update using (auth.role() = 'authenticated');

create policy "Authenticated users can view conversations" on public.conversations for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert conversations" on public.conversations for insert with check (auth.role() = 'authenticated');

-- Create indexes for performance
create index if not exists idx_buyers_status on public.buyers(status);
create index if not exists idx_buyers_quality_score on public.buyers(quality_score desc);
create index if not exists idx_buyers_created_at on public.buyers(created_at desc);
create index if not exists idx_buyers_assigned_to on public.buyers(assigned_to);
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_company_id on public.campaigns(company_id);
create index if not exists idx_campaigns_development on public.campaigns(development);
create index if not exists idx_companies_stripe_customer_id on public.companies(stripe_customer_id);

-- Function to auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger on_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger on_companies_updated before update on public.companies
  for each row execute function public.handle_updated_at();
create trigger on_campaigns_updated before update on public.campaigns
  for each row execute function public.handle_updated_at();
create trigger on_buyers_updated before update on public.buyers
  for each row execute function public.handle_updated_at();

-- Function to auto-populate first_name/last_name from full_name
create or replace function public.handle_buyer_name_split()
returns trigger as $$
begin
  -- Only set if full_name exists and first_name is null
  if new.full_name is not null and new.first_name is null then
    new.first_name := split_part(new.full_name, ' ', 1);
    if position(' ' in new.full_name) > 0 then
      new.last_name := substring(new.full_name from position(' ' in new.full_name) + 1);
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-split names on insert
create trigger on_buyer_name_split before insert on public.buyers
  for each row execute function public.handle_buyer_name_split();
