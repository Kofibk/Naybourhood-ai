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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Companies table
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('Developer', 'Agent', 'Broker', 'Marketing Agency', 'Financial Advisor')),
  contact_name text,
  contact_email text,
  contact_phone text,
  status text check (status in ('Active', 'Inactive', 'Pending')) default 'Active',
  subscription_tier text check (subscription_tier in ('access', 'growth', 'enterprise')),
  total_spend numeric default 0,
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
  full_name text not null,
  email text,
  phone text,
  budget text,
  budget_min numeric,
  budget_max numeric,
  bedrooms integer,
  location text,
  timeline text,
  source text,
  campaign text,
  campaign_id uuid references public.campaigns(id),
  company_id uuid references public.companies(id),
  status text check (status in ('New', 'Contacted', 'Qualified', 'Viewing Booked', 'Offer Made', 'Completed', 'Lost', 'Documentation')) default 'New',
  quality_score integer check (quality_score >= 0 and quality_score <= 100),
  intent_score integer check (intent_score >= 0 and intent_score <= 100),
  proof_of_funds boolean default false,
  uk_broker boolean default false,
  uk_solicitor boolean default false,
  notes text,
  tags text[],
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
create index if not exists idx_campaigns_status on public.campaigns(status);
create index if not exists idx_campaigns_company_id on public.campaigns(company_id);

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

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.email = 'kofi@naybourhood.ai' then 'admin'
      else 'developer'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
