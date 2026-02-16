/**
 * Test fixtures: Sample buyers for testing the scoring system and full journey.
 */
import type { Buyer } from '@/types'

/** Hot Lead: Cash buyer, 28-day ready, £1.5M budget, 3-bed, primary residence */
export const hotLeadCashBuyer: Buyer = {
  id: 'test-hot-1',
  full_name: 'Sarah Mitchell',
  first_name: 'Sarah',
  last_name: 'Mitchell',
  email: 'sarah.mitchell@protonmail.com',
  phone: '+447700900123',
  country: 'UK',
  budget: '£1.5M',
  budget_range: '£1M-£2M',
  payment_method: 'Cash',
  bedrooms: 3,
  location: 'London',
  timeline: 'ASAP/28 days',
  timeline_to_purchase: 'ASAP/28 days',
  purpose: 'Residence',
  purchase_purpose: 'Residence',
  ready_within_28_days: true,
  source: 'Rightmove',
  source_platform: 'form',
  status: 'Contact Pending',
  proof_of_funds: true,
  uk_broker: 'no',
  uk_solicitor: 'yes',
}

/** Qualified: Mortgage buyer, 1-3 month timeline, £750K budget */
export const qualifiedMortgageBuyer: Buyer = {
  id: 'test-qualified-1',
  full_name: 'James Thompson',
  first_name: 'James',
  last_name: 'Thompson',
  email: 'james.thompson@gmail.com',
  phone: '+447700900456',
  country: 'UK',
  budget_range: '£500k-£750k',
  payment_method: 'Mortgage',
  mortgage_status: 'aip',
  bedrooms: 2,
  location: 'Manchester',
  timeline: '1-3 months',
  purchase_purpose: 'Investment',
  source: 'website',
  status: 'Follow Up',
  uk_broker: 'yes',
  uk_solicitor: 'no',
}

/** Nurture: Long timeline, no urgency */
export const nurtureBuyer: Buyer = {
  id: 'test-nurture-1',
  full_name: 'Emily Rogers',
  email: 'emily.rogers@outlook.com',
  country: 'UK',
  budget_range: '£250k-£500k',
  payment_method: 'Mortgage',
  timeline: '6-12 months',
  purchase_purpose: 'Investment',
  source: 'email',
  status: 'Contact Pending',
}

/** Low Priority: Holiday home, no timeline, minimal info */
export const lowPriorityBuyer: Buyer = {
  id: 'test-low-1',
  full_name: 'Michael Davies',
  email: 'michael.d@hotmail.com',
  timeline: 'no rush',
  purchase_purpose: 'holiday home',
  status: 'Contact Pending',
}

/** Fake Lead: Suspicious patterns */
export const fakeLeadBuyer: Buyer = {
  id: 'test-fake-1',
  full_name: 'Test User',
  email: 'test@example.com',
  phone: '0000000000',
  budget: '£500',
  status: 'Contact Pending',
}

/** Disqualified: £2M+ budget with studio */
export const disqualifiedBuyer: Buyer = {
  id: 'test-disqualified-1',
  full_name: 'Robert Chen',
  email: 'robert.chen@china.com',
  phone: '+8613800138000',
  budget: '£3M',
  bedrooms: 1,
  payment_method: 'Cash',
  status: 'Contact Pending',
}

/** International buyer: Non-UK based */
export const internationalBuyer: Buyer = {
  id: 'test-intl-1',
  full_name: 'Ahmad Al-Rashid',
  email: 'ahmad@dubai-investments.ae',
  phone: '+971501234567',
  country: 'UAE',
  budget: '£2M',
  bedrooms: 4,
  payment_method: 'Cash',
  location: 'Central London',
  timeline: '1-3 months',
  purchase_purpose: 'Investment',
  source: 'referral',
  proof_of_funds: true,
  uk_broker: 'introduced',
  uk_solicitor: 'introduced',
  status: 'Follow Up',
}

/** CSV test buyers (5 records for CSV import test) */
export const csvTestBuyers = [
  {
    first_name: 'Alice',
    last_name: 'Brown',
    email: 'alice.brown@email.com',
    phone: '+447700111001',
    budget_range: '£500k-£750k',
    preferred_bedrooms: '2',
    purchase_purpose: 'Residence',
    payment_method: 'Mortgage',
    timeline_to_purchase: '1-3 months',
    preferred_location: 'Bristol',
    country: 'UK',
    development_name: 'Marine Heights',
  },
  {
    first_name: 'Bob',
    last_name: 'Smith',
    email: 'bob.smith@email.com',
    phone: '+447700111002',
    budget_range: '£1M-£2M',
    preferred_bedrooms: '3',
    purchase_purpose: 'Investment',
    payment_method: 'Cash',
    timeline_to_purchase: 'ASAP/28 days',
    preferred_location: 'London',
    country: 'UK',
    development_name: 'Marine Heights',
  },
  {
    first_name: 'Catherine',
    last_name: 'Lee',
    email: 'catherine.lee@email.com',
    phone: '+447700111003',
    budget_range: '£750k-£1M',
    preferred_bedrooms: '4',
    purchase_purpose: 'Residence',
    payment_method: 'Mortgage',
    timeline_to_purchase: '3-6 months',
    preferred_location: 'Oxford',
    country: 'UK',
    development_name: 'Marine Heights',
  },
  {
    first_name: 'David',
    last_name: 'Patel',
    email: 'david.patel@email.com',
    phone: '+447700111004',
    budget_range: '£250k-£500k',
    preferred_bedrooms: '1',
    purchase_purpose: 'Investment',
    payment_method: 'Mortgage',
    timeline_to_purchase: '6-12 months',
    preferred_location: 'Birmingham',
    country: 'UK',
    development_name: '',
  },
  {
    first_name: 'Eva',
    last_name: 'Kowalski',
    email: 'eva.kowalski@email.com',
    phone: '+447700111005',
    budget_range: '£2M+',
    preferred_bedrooms: '4+',
    purchase_purpose: 'Residence',
    payment_method: 'Cash',
    timeline_to_purchase: 'ASAP/28 days',
    preferred_location: 'Chelsea, London',
    country: 'Poland',
    development_name: 'Marine Heights',
  },
]

/** CSV content string for upload testing */
export const csvContent = `first_name,last_name,email,phone,budget_range,preferred_bedrooms,purchase_purpose,payment_method,timeline_to_purchase,preferred_location,country,development_name
Alice,Brown,alice.brown@email.com,+447700111001,£500k-£750k,2,Residence,Mortgage,1-3 months,Bristol,UK,Marine Heights
Bob,Smith,bob.smith@email.com,+447700111002,£1M-£2M,3,Investment,Cash,ASAP/28 days,London,UK,Marine Heights
Catherine,Lee,catherine.lee@email.com,+447700111003,£750k-£1M,4,Residence,Mortgage,3-6 months,Oxford,UK,Marine Heights
David,Patel,david.patel@email.com,+447700111004,£250k-£500k,1,Investment,Mortgage,6-12 months,Birmingham,UK,
Eva,Kowalski,eva.kowalski@email.com,+447700111005,£2M+,4+,Residence,Cash,ASAP/28 days,Chelsea London,Poland,Marine Heights`
