-- Naybourhood Seed Data
-- Run this after schema.sql to populate test data

-- Insert companies
insert into public.companies (id, name, type, contact_name, contact_email, status, subscription_tier, total_spend, total_leads, campaign_count) values
  ('11111111-1111-1111-1111-111111111111', 'Berkeley Group', 'Developer', 'John Smith', 'j.smith@berkeley.com', 'Active', 'enterprise', 145000, 523, 8),
  ('22222222-2222-2222-2222-222222222222', 'Regal London', 'Developer', 'Alice Brown', 'a.brown@regallondon.com', 'Active', 'growth', 98000, 345, 5),
  ('33333333-3333-3333-3333-333333333333', 'JLL', 'Agent', 'Michael Davies', 'm.davies@jll.com', 'Active', 'enterprise', 120000, 456, 7),
  ('44444444-4444-4444-4444-444444444444', 'Mount Anvil', 'Developer', 'Sarah Green', 's.green@mountanvil.com', 'Active', 'growth', 87000, 312, 4),
  ('55555555-5555-5555-5555-555555555555', 'Hadley Property Group', 'Developer', 'Tom Wilson', 't.wilson@hadley.com', 'Active', 'access', 45000, 189, 3),
  ('66666666-6666-6666-6666-666666666666', 'London Square', 'Developer', 'Emma Clark', 'e.clark@londonsquare.com', 'Active', 'growth', 72000, 267, 4);

-- Insert campaigns
insert into public.campaigns (id, name, client, company_id, platform, status, spend, leads, cpl, impressions, clicks, ctr, start_date) values
  ('aaaa1111-1111-1111-1111-111111111111', 'Berkeley Nine Elms', 'Berkeley Group', '11111111-1111-1111-1111-111111111111', 'Meta', 'active', 45000, 234, 43, 1250000, 15600, 1.25, '2024-01-01'),
  ('aaaa2222-2222-2222-2222-222222222222', 'Regal Wembley Park', 'Regal London', '22222222-2222-2222-2222-222222222222', 'Google', 'active', 38000, 189, 52, 980000, 12400, 1.27, '2024-02-15'),
  ('aaaa3333-3333-3333-3333-333333333333', 'Mount Anvil Lewisham', 'Mount Anvil', '44444444-4444-4444-4444-444444444444', 'Meta', 'active', 52000, 312, 39, 1450000, 18900, 1.30, '2024-01-20'),
  ('aaaa4444-4444-4444-4444-444444444444', 'Hadley Canary Wharf', 'Hadley Property', '55555555-5555-5555-5555-555555555555', 'Google', 'paused', 28000, 145, 48, 720000, 8900, 1.24, '2024-03-01'),
  ('aaaa5555-5555-5555-5555-555555555555', 'JLL Westminster', 'JLL', '33333333-3333-3333-3333-333333333333', 'Meta', 'active', 61000, 287, 42, 1680000, 21200, 1.26, '2024-01-10'),
  ('aaaa6666-6666-6666-6666-666666666666', 'London Square Putney', 'London Square', '66666666-6666-6666-6666-666666666666', 'TikTok', 'active', 35000, 156, 45, 890000, 9800, 1.10, '2024-04-01'),
  ('aaaa7777-7777-7777-7777-777777777777', 'Berkeley Chelsea Creek', 'Berkeley Group', '11111111-1111-1111-1111-111111111111', 'Google', 'active', 55000, 198, 55, 1100000, 14200, 1.29, '2024-02-01');

-- Insert buyers/leads
insert into public.buyers (id, full_name, email, phone, budget, budget_min, budget_max, bedrooms, location, timeline, source, campaign, campaign_id, status, quality_score, intent_score, proof_of_funds, uk_broker, uk_solicitor, last_contact) values
  ('bbbb1111-1111-1111-1111-111111111111', 'James Chen', 'james.chen@email.com', '+44 7911 123456', '£800K-1M', 800000, 1000000, 2, 'South West London', 'Within 3 months', 'Meta Ads', 'Berkeley Nine Elms', 'aaaa1111-1111-1111-1111-111111111111', 'Qualified', 94, 91, true, true, false, now() - interval '2 days'),
  ('bbbb2222-2222-2222-2222-222222222222', 'Sarah Williams', 'sarah.w@email.com', '+44 7911 234567', '£1.2M-1.5M', 1200000, 1500000, 3, 'Central London', 'Immediate', 'Google Ads', 'Regal Wembley Park', 'aaaa2222-2222-2222-2222-222222222222', 'Viewing Booked', 89, 95, true, true, true, now() - interval '1 day'),
  ('bbbb3333-3333-3333-3333-333333333333', 'David Park', 'd.park@email.com', '+44 7911 345678', '£600K-800K', 600000, 800000, 2, 'East London', 'Within 1 month', 'Rightmove', 'Mount Anvil Lewisham', 'aaaa3333-3333-3333-3333-333333333333', 'Documentation', 86, 88, false, true, false, now() - interval '4 days'),
  ('bbbb4444-4444-4444-4444-444444444444', 'Emma Thompson', 'emma.t@email.com', '+44 7911 456789', '£500K-600K', 500000, 600000, 1, 'North London', 'Within 6 months', 'Meta Ads', 'Hadley Canary Wharf', 'aaaa4444-4444-4444-4444-444444444444', 'New', 72, 65, false, false, false, null),
  ('bbbb5555-5555-5555-5555-555555555555', 'Michael Roberts', 'm.roberts@email.com', '+44 7911 567890', '£2M+', 2000000, 3000000, 4, 'Chelsea', 'Flexible', 'Direct', 'JLL Westminster', 'aaaa5555-5555-5555-5555-555555555555', 'Qualified', 91, 78, true, true, true, now() - interval '3 days'),
  ('bbbb6666-6666-6666-6666-666666666666', 'Olivia Zhang', 'o.zhang@email.com', '+44 7911 678901', '£1.5M-2M', 1500000, 2000000, 3, 'Kensington', 'Within 2 months', 'Google Ads', 'Berkeley Chelsea Creek', 'aaaa7777-7777-7777-7777-777777777777', 'Contacted', 87, 82, true, true, false, now() - interval '5 days'),
  ('bbbb7777-7777-7777-7777-777777777777', 'Ahmed Hassan', 'a.hassan@email.com', '+44 7911 789012', '£750K-900K', 750000, 900000, 2, 'Canary Wharf', 'Immediate', 'TikTok', 'London Square Putney', 'aaaa6666-6666-6666-6666-666666666666', 'Viewing Booked', 83, 90, true, false, false, now()),
  ('bbbb8888-8888-8888-8888-888888888888', 'Lucy Martinez', 'l.martinez@email.com', '+44 7911 890123', '£400K-500K', 400000, 500000, 1, 'Stratford', 'Within 6 months', 'Meta Ads', 'Mount Anvil Lewisham', 'aaaa3333-3333-3333-3333-333333333333', 'New', 68, 55, false, false, false, null),
  ('bbbb9999-9999-9999-9999-999999999999', 'Thomas Brown', 't.brown@email.com', '+44 7911 901234', '£1M-1.2M', 1000000, 1200000, 3, 'Battersea', 'Within 3 months', 'Direct', 'Berkeley Nine Elms', 'aaaa1111-1111-1111-1111-111111111111', 'Qualified', 90, 85, true, true, true, now() - interval '1 day'),
  ('bbbba000-0000-0000-0000-000000000000', 'Sophie Anderson', 's.anderson@email.com', '+44 7911 012345', '£650K-800K', 650000, 800000, 2, 'Greenwich', 'Within 2 months', 'Zoopla', 'Regal Wembley Park', 'aaaa2222-2222-2222-2222-222222222222', 'Contacted', 79, 72, false, true, false, now() - interval '6 days'),
  ('bbbbb111-1111-1111-1111-111111111111', 'Daniel Kim', 'd.kim@email.com', '+44 7911 111111', '£3M+', 3000000, 5000000, 5, 'Mayfair', 'Flexible', 'Direct', 'JLL Westminster', 'aaaa5555-5555-5555-5555-555555555555', 'Qualified', 96, 70, true, true, true, now() - interval '7 days'),
  ('bbbbb222-2222-2222-2222-222222222222', 'Rebecca Taylor', 'r.taylor@email.com', '+44 7911 222222', '£550K-700K', 550000, 700000, 2, 'Woolwich', 'Within 4 months', 'Meta Ads', 'Berkeley Nine Elms', 'aaaa1111-1111-1111-1111-111111111111', 'New', 71, 68, false, false, false, null);

-- Insert some conversations
insert into public.conversations (buyer_id, channel, direction, content, status, created_at) values
  ('bbbb1111-1111-1111-1111-111111111111', 'email', 'outbound', 'Hi James, thank you for your enquiry about Berkeley Nine Elms. I would love to arrange a viewing for you.', 'delivered', now() - interval '2 days'),
  ('bbbb1111-1111-1111-1111-111111111111', 'email', 'inbound', 'Hi, yes I am very interested. Can we arrange for this Saturday?', 'read', now() - interval '1 day 20 hours'),
  ('bbbb2222-2222-2222-2222-222222222222', 'whatsapp', 'outbound', 'Hi Sarah, your viewing is confirmed for tomorrow at 2pm. Looking forward to seeing you!', 'read', now() - interval '1 day'),
  ('bbbb2222-2222-2222-2222-222222222222', 'whatsapp', 'inbound', 'Perfect, see you then!', 'read', now() - interval '23 hours'),
  ('bbbb7777-7777-7777-7777-777777777777', 'phone', 'outbound', 'Called Ahmed - confirmed viewing for Thursday. Very keen on the Canary Wharf location.', 'delivered', now() - interval '2 hours');
