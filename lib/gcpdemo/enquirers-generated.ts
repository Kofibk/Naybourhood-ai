import type { DemoEnquirer, PipelineStatus, RiskLevel, VerificationStatus } from './types'

/**
 * 48 Auto-Generated Enquirers with partial data
 * Pipeline distribution: Scored(18-5key=13), Viewing Booked(10-2=8), Viewing Complete(8-2=6),
 * Verification In Progress(6-1=5), Verified(5-1=4), Tenancy Signed(4-1=3),
 * Flagged(5-2=3), Fell Through(2), Archived(2)
 */

interface GeneratedProfile {
  firstName: string
  lastName: string
  employer: string
  role: string
  income: number
  score: number
  intent: number
  risk: RiskLevel
  status: PipelineStatus
  verification: VerificationStatus
  days: number
  unit: string | null
  email: string
}

const profiles: GeneratedProfile[] = [
  // Scored (13 more)
  { firstName: 'Hannah', lastName: 'Mitchell', employer: 'Barclays', role: 'Relationship Manager', income: 62000, score: 68, intent: 65, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 1, unit: null, email: 'hannah.mitchell@barclays.co.uk' },
  { firstName: 'George', lastName: 'Patterson', employer: 'PwC', role: 'Audit Associate', income: 55000, score: 64, intent: 60, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 2, unit: null, email: 'george.patterson@pwc.com' },
  { firstName: 'Fatima', lastName: 'Hassan', employer: 'University College London', role: 'Research Fellow', income: 52000, score: 60, intent: 58, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 3, unit: null, email: 'f.hassan@ucl.ac.uk' },
  { firstName: 'William', lastName: 'Foster', employer: 'BT Group', role: 'Network Engineer', income: 58000, score: 66, intent: 63, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 1, unit: null, email: 'william.foster@bt.com' },
  { firstName: 'Amara', lastName: 'Osei', employer: 'Burberry', role: 'Brand Manager', income: 65000, score: 72, intent: 70, risk: 'Low', status: 'Scored', verification: 'Not Started', days: 2, unit: null, email: 'amara.osei@burberry.com' },
  { firstName: 'Daniel', lastName: 'Murphy', employer: 'Linklaters', role: 'Trainee Solicitor', income: 48000, score: 55, intent: 52, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 4, unit: null, email: 'daniel.murphy@linklaters.com' },
  { firstName: 'Mei', lastName: 'Zhang', employer: 'HSBC', role: 'Compliance Officer', income: 72000, score: 74, intent: 71, risk: 'Low', status: 'Scored', verification: 'Not Started', days: 1, unit: null, email: 'mei.zhang@hsbc.com' },
  { firstName: 'Ben', lastName: 'Taylor', employer: 'Spotify', role: 'Data Scientist', income: 85000, score: 78, intent: 75, risk: 'Low', status: 'Scored', verification: 'Not Started', days: 3, unit: null, email: 'ben.taylor@spotify.com' },
  { firstName: 'Isabelle', lastName: 'Clarke', employer: 'John Lewis', role: 'Buyer', income: 45000, score: 48, intent: 45, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 5, unit: null, email: 'isabelle.clarke@johnlewis.com' },
  { firstName: 'Ade', lastName: 'Williams', employer: 'Sky', role: 'Production Manager', income: 56000, score: 62, intent: 60, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 2, unit: null, email: 'ade.williams@sky.uk' },
  { firstName: 'Sanjay', lastName: 'Gupta', employer: 'McKinsey', role: 'Associate', income: 92000, score: 80, intent: 78, risk: 'Low', status: 'Scored', verification: 'Not Started', days: 1, unit: null, email: 'sanjay.gupta@mckinsey.com' },
  { firstName: 'Louise', lastName: 'Baker', employer: 'Sainsburys', role: 'Category Manager', income: 55000, score: 58, intent: 55, risk: 'Medium', status: 'Scored', verification: 'Not Started', days: 3, unit: null, email: 'louise.baker@sainsburys.co.uk' },
  { firstName: 'Ravi', lastName: 'Patel', employer: 'Microsoft', role: 'Cloud Solutions Architect', income: 105000, score: 84, intent: 80, risk: 'Low', status: 'Scored', verification: 'Not Started', days: 1, unit: null, email: 'ravi.patel@microsoft.com' },

  // Viewing Booked (8 more)
  { firstName: 'Charlotte', lastName: 'Evans', employer: 'Allen & Overy', role: 'Associate', income: 82000, score: 80, intent: 78, risk: 'Low', status: 'Viewing Booked', verification: 'Verified', days: 6, unit: '2C', email: 'charlotte.evans@allenovery.com' },
  { firstName: 'Kwame', lastName: 'Mensah', employer: 'JP Morgan', role: 'Vice President', income: 110000, score: 88, intent: 85, risk: 'Low', status: 'Viewing Booked', verification: 'Verified', days: 5, unit: '6B', email: 'kwame.mensah@jpmorgan.com' },
  { firstName: 'Emily', lastName: 'Wilson', employer: 'BBC', role: 'Senior Producer', income: 65000, score: 70, intent: 68, risk: 'Low', status: 'Viewing Booked', verification: 'Not Started', days: 4, unit: '5D', email: 'emily.wilson@bbc.co.uk' },
  { firstName: 'Liam', lastName: 'O\'Brien', employer: 'Arup', role: 'Structural Engineer', income: 62000, score: 68, intent: 66, risk: 'Low', status: 'Viewing Booked', verification: 'Not Started', days: 3, unit: '10A', email: 'liam.obrien@arup.com' },
  { firstName: 'Natasha', lastName: 'Ivanova', employer: 'Sothebys', role: 'Art Specialist', income: 75000, score: 74, intent: 72, risk: 'Low', status: 'Viewing Booked', verification: 'Verified', days: 7, unit: '3B', email: 'natasha.ivanova@sothebys.com' },
  { firstName: 'Alex', lastName: 'Rowe', employer: 'Meta', role: 'Software Engineer', income: 95000, score: 82, intent: 80, risk: 'Low', status: 'Viewing Booked', verification: 'Verified', days: 4, unit: '9B', email: 'alex.rowe@meta.com' },
  { firstName: 'Zara', lastName: 'Khan', employer: 'Freshfields', role: 'Senior Associate', income: 88000, score: 83, intent: 81, risk: 'Low', status: 'Viewing Booked', verification: 'Verified', days: 5, unit: '6B', email: 'zara.khan@freshfields.com' },
  { firstName: 'Patrick', lastName: 'Duffy', employer: 'Rolls-Royce', role: 'Project Manager', income: 72000, score: 73, intent: 70, risk: 'Low', status: 'Viewing Booked', verification: 'Not Started', days: 3, unit: '4A', email: 'patrick.duffy@rolls-royce.com' },

  // Viewing Complete (6 more)
  { firstName: 'Jessica', lastName: 'Thomas', employer: 'Unilever', role: 'Marketing Director', income: 95000, score: 81, intent: 79, risk: 'Low', status: 'Viewing Complete', verification: 'Verified', days: 14, unit: '6B', email: 'jessica.thomas@unilever.com' },
  { firstName: 'Michael', lastName: 'Wright', employer: 'Schroders', role: 'Fund Manager', income: 120000, score: 89, intent: 87, risk: 'Low', status: 'Viewing Complete', verification: 'Verified', days: 11, unit: '9B', email: 'michael.wright@schroders.com' },
  { firstName: 'Ayesha', lastName: 'Begum', employer: 'Kings College London', role: 'Lecturer', income: 58000, score: 63, intent: 60, risk: 'Medium', status: 'Viewing Complete', verification: 'Verified', days: 16, unit: '8C', email: 'ayesha.begum@kcl.ac.uk' },
  { firstName: 'Thomas', lastName: 'Green', employer: 'Lloyds Banking Group', role: 'Risk Analyst', income: 62000, score: 67, intent: 64, risk: 'Low', status: 'Viewing Complete', verification: 'Verified', days: 13, unit: '5D', email: 'thomas.green@lloydsbanking.com' },
  { firstName: 'Laura', lastName: 'Harris', employer: 'WPP', role: 'Account Director', income: 75000, score: 75, intent: 73, risk: 'Low', status: 'Viewing Complete', verification: 'Verified', days: 10, unit: '10A', email: 'laura.harris@wpp.com' },
  { firstName: 'Samuel', lastName: 'Lee', employer: 'British Airways', role: 'Operations Manager', income: 68000, score: 70, intent: 67, risk: 'Low', status: 'Viewing Complete', verification: 'Verified', days: 12, unit: '7A', email: 'samuel.lee@ba.com' },

  // Verification In Progress (5 more)
  { firstName: 'Catherine', lastName: 'Brown', employer: 'NHS — Chelsea & Westminster', role: 'Consultant Psychiatrist', income: 95000, score: 83, intent: 80, risk: 'Low', status: 'Verification In Progress', verification: 'Verifying', days: 8, unit: '3B', email: 'catherine.brown@nhs.net' },
  { firstName: 'Faisal', lastName: 'Ahmed', employer: 'EY', role: 'Manager, Tax', income: 78000, score: 77, intent: 74, risk: 'Low', status: 'Verification In Progress', verification: 'Verifying', days: 7, unit: '5D', email: 'faisal.ahmed@ey.com' },
  { firstName: 'Anna', lastName: 'Kowalski', employer: 'Amazon', role: 'Senior Product Manager', income: 100000, score: 85, intent: 82, risk: 'Low', status: 'Verification In Progress', verification: 'Verifying', days: 6, unit: '9B', email: 'anna.kowalski@amazon.co.uk' },
  { firstName: 'Joshua', lastName: 'Cooper', employer: 'Clifford Chance', role: 'Associate', income: 72000, score: 76, intent: 73, risk: 'Low', status: 'Verification In Progress', verification: 'Verifying', days: 9, unit: '2C', email: 'joshua.cooper@cliffordchance.com' },
  { firstName: 'Grace', lastName: 'O\'Neill', employer: 'Channel 4', role: 'Commissioning Editor', income: 70000, score: 73, intent: 70, risk: 'Low', status: 'Verification In Progress', verification: 'Verifying', days: 5, unit: '10A', email: 'grace.oneill@channel4.com' },

  // Verified (4 more)
  { firstName: 'Henry', lastName: 'Scott', employer: 'Morgan Stanley', role: 'Associate Director', income: 105000, score: 86, intent: 84, risk: 'Low', status: 'Verified', verification: 'Verified', days: 18, unit: '6B', email: 'henry.scott@morganstanley.com' },
  { firstName: 'Olivia', lastName: 'King', employer: 'Imperial College London', role: 'Associate Professor', income: 82000, score: 79, intent: 76, risk: 'Low', status: 'Verified', verification: 'Verified', days: 16, unit: '3B', email: 'olivia.king@imperial.ac.uk' },
  { firstName: 'Noah', lastName: 'Campbell', employer: 'Accenture', role: 'Senior Manager', income: 90000, score: 81, intent: 79, risk: 'Low', status: 'Verified', verification: 'Verified', days: 15, unit: '9B', email: 'noah.campbell@accenture.com' },
  { firstName: 'Emma', lastName: 'Davies', employer: 'Savills', role: 'Head of Research', income: 78000, score: 77, intent: 75, risk: 'Low', status: 'Verified', verification: 'Verified', days: 17, unit: '2C', email: 'emma.davies@savills.com' },

  // Tenancy Signed (3 more)
  { firstName: 'Jack', lastName: 'Robinson', employer: 'Goldman Sachs', role: 'Associate', income: 85000, score: 84, intent: 88, risk: 'Low', status: 'Tenancy Signed', verification: 'Verified', days: 25, unit: '4A', email: 'jack.robinson@gs.com' },
  { firstName: 'Mia', lastName: 'Thompson', employer: 'Herbert Smith Freehills', role: 'Senior Associate', income: 92000, score: 86, intent: 90, risk: 'Low', status: 'Tenancy Signed', verification: 'Verified', days: 22, unit: '5D', email: 'mia.thompson@hsf.com' },
  { firstName: 'Ethan', lastName: 'Morgan', employer: 'Barclays', role: 'Director, Investment Banking', income: 130000, score: 90, intent: 92, risk: 'Low', status: 'Tenancy Signed', verification: 'Verified', days: 28, unit: '6B', email: 'ethan.morgan@barclays.co.uk' },

  // Flagged (3 more)
  { firstName: 'Ryan', lastName: 'Hughes', employer: 'NextGen Solutions', role: 'CEO', income: 40000, score: 32, intent: 35, risk: 'High', status: 'Flagged', verification: 'Failed', days: 9, unit: null, email: 'ryan.hughes@nextgensolutions.io' },
  { firstName: 'Jade', lastName: 'Williams', employer: 'Creative Agency Ltd', role: 'Creative Director', income: 42000, score: 36, intent: 38, risk: 'High', status: 'Flagged', verification: 'Failed', days: 11, unit: null, email: 'jade.w.creative@outlook.com' },
  { firstName: 'Stefan', lastName: 'Novak', employer: 'Independent', role: 'Property Investor', income: 60000, score: 42, intent: 40, risk: 'High', status: 'Flagged', verification: 'Failed', days: 7, unit: null, email: 'stefan.novak.invest@yahoo.com' },

  // Fell Through (2)
  { firstName: 'Lucy', lastName: 'Price', employer: 'Deloitte', role: 'Consultant', income: 65000, score: 72, intent: 30, risk: 'Low', status: 'Fell Through', verification: 'Verified', days: 30, unit: '8C', email: 'lucy.price@deloitte.co.uk' },
  { firstName: 'James', lastName: 'Bennett', employer: 'BNP Paribas', role: 'Analyst', income: 58000, score: 66, intent: 25, risk: 'Low', status: 'Fell Through', verification: 'Verified', days: 35, unit: '1A', email: 'james.bennett@bnpparibas.com' },

  // Archived (2)
  { firstName: 'Test', lastName: 'User', employer: 'N/A', role: 'N/A', income: 0, score: 12, intent: 5, risk: 'High', status: 'Archived', verification: 'Failed', days: 20, unit: null, email: 'test123@tempmail.com' },
  { firstName: 'Spam', lastName: 'Bot', employer: 'N/A', role: 'N/A', income: 0, score: 8, intent: 3, risk: 'High', status: 'Archived', verification: 'Failed', days: 15, unit: null, email: 'freemoney@spam.net' },
]

export const GENERATED_ENQUIRERS: DemoEnquirer[] = profiles.map((p, i) => ({
  id: `enq-gen-${i + 1}`,
  firstName: p.firstName,
  lastName: p.lastName,
  fullName: `${p.firstName} ${p.lastName}`,
  email: p.email,
  phone: `+44791123${String(4013 + i).padStart(4, '0')}`,
  employer: p.employer,
  role: p.role,
  annualIncome: p.income,
  aiScore: p.score,
  intentScore: p.intent,
  riskLevel: p.risk,
  pipelineStatus: p.status,
  verificationStatus: p.verification,
  daysInPipeline: p.days,
  linkedUnit: p.unit,
  area: 'Kensington',
}))
