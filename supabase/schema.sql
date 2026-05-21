-- =============================================
-- CRM Schema — Run this in Supabase SQL editor
-- =============================================

-- Companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  size_range text check (size_range in ('1-10', '11-50', '51-200', '200+')),
  website text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  role text,
  company_id uuid references companies(id) on delete set null,
  lead_source text check (lead_source in ('LinkedIn', 'Cold Email', 'Referral', 'Inbound', 'Other')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Deals
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id uuid references companies(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  stage text not null check (stage in (
    'Prospecting', 'Contacted', 'Meeting Booked',
    'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'
  )),
  value numeric default 0,
  currency text default 'GBP',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null check (priority in ('High', 'Medium', 'Low')),
  due_date date,
  status text default 'Open' check (status in ('Open', 'Complete')),
  assigned_to uuid references auth.users(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null check (entity_type in ('company', 'contact', 'deal', 'task')),
  entity_id uuid not null,
  entity_name text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- =============================================
-- Row Level Security
-- =============================================

alter table companies enable row level security;
alter table contacts enable row level security;
alter table deals enable row level security;
alter table tasks enable row level security;
alter table activity_log enable row level security;

-- Authenticated users can read/write everything (shared team workspace)
create policy "Authenticated users full access" on companies
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on contacts
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on deals
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on tasks
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on activity_log
  for all using (auth.role() = 'authenticated');

-- =============================================
-- Seed Data (5 companies, 10 contacts, 3 deals, 3 tasks)
-- Run AFTER creating your first user account
-- =============================================

-- Seed companies
insert into companies (name, industry, size_range, website, notes) values
  ('Apex Digital', 'SaaS', '11-50', 'https://apexdigital.io', 'Warm lead — interested in AI automation'),
  ('Nova Commerce', 'E-commerce', '51-200', 'https://novacommerce.co', 'Large e-commerce brand, multiple decision makers'),
  ('Vertex Capital', 'Finance', '11-50', 'https://vertexcap.com', 'VC firm looking to automate outreach'),
  ('Bloom Health', 'Healthcare', '51-200', 'https://bloomhealth.app', 'Healthcare startup, GDPR-sensitive'),
  ('Sparks Agency', 'Marketing', '1-10', 'https://sparksagency.co', 'Creative agency, referral from John');

-- Seed contacts (requires companies to exist)
insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'James', 'Carter', 'james@apexdigital.io', '+44 7700 900001', 'CEO',
  id, 'LinkedIn', 'Very engaged on LinkedIn, replied within an hour'
from companies where name = 'Apex Digital';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Sarah', 'Mitchell', 'sarah@apexdigital.io', '+44 7700 900002', 'Head of Growth',
  id, 'Cold Email', 'Works closely with James on new tools'
from companies where name = 'Apex Digital';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Tom', 'Harris', 'tom@novacommerce.co', '+44 7700 900003', 'COO',
  id, 'Referral', 'Referred by Sarah Mitchell'
from companies where name = 'Nova Commerce';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Emma', 'Blake', 'emma@novacommerce.co', '+44 7700 900004', 'Head of Ops',
  id, 'LinkedIn', 'Decision maker for ops tools'
from companies where name = 'Nova Commerce';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Oliver', 'Patel', 'oliver@vertexcap.com', '+44 7700 900005', 'Managing Partner',
  id, 'Cold Email', 'Replied to second email in sequence'
from companies where name = 'Vertex Capital';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Chloe', 'Evans', 'chloe@vertexcap.com', '+44 7700 900006', 'Operations Lead',
  id, 'LinkedIn', 'In charge of vendor selection'
from companies where name = 'Vertex Capital';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Aisha', 'Rahman', 'aisha@bloomhealth.app', '+44 7700 900007', 'CTO',
  id, 'Inbound', 'Filled in contact form on website'
from companies where name = 'Bloom Health';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Marcus', 'Lee', 'marcus@bloomhealth.app', '+44 7700 900008', 'CEO',
  id, 'Referral', 'Knows Oliver Patel from Vertex'
from companies where name = 'Bloom Health';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Lily', 'Stone', 'lily@sparksagency.co', '+44 7700 900009', 'Founder',
  id, 'Referral', 'Warm referral, ready to buy'
from companies where name = 'Sparks Agency';

insert into contacts (first_name, last_name, email, phone, role, company_id, lead_source, notes)
select
  'Dan', 'Walsh', 'dan@sparksagency.co', '+44 7700 900010', 'Creative Director',
  id, 'Cold Email', 'Interested in outbound sequences'
from companies where name = 'Sparks Agency';

-- Seed deals
insert into deals (name, company_id, contact_id, stage, value)
select
  'Apex Digital — AI Automation Setup',
  c.id,
  co.id,
  'Proposal Sent',
  8500
from companies c
join contacts co on co.company_id = c.id and co.email = 'james@apexdigital.io'
where c.name = 'Apex Digital';

insert into deals (name, company_id, contact_id, stage, value)
select
  'Nova Commerce — Outbound Sequences',
  c.id,
  co.id,
  'Meeting Booked',
  12000
from companies c
join contacts co on co.company_id = c.id and co.email = 'tom@novacommerce.co'
where c.name = 'Nova Commerce';

insert into deals (name, company_id, contact_id, stage, value)
select
  'Sparks Agency — Lead Gen Package',
  c.id,
  co.id,
  'Contacted',
  3500
from companies c
join contacts co on co.company_id = c.id and co.email = 'lily@sparksagency.co'
where c.name = 'Sparks Agency';

-- Seed tasks
insert into tasks (title, priority, due_date, status)
values
  ('Follow up with James Carter at Apex Digital', 'High', current_date + 1, 'Open'),
  ('Send proposal to Nova Commerce', 'High', current_date + 2, 'Open'),
  ('Research Bloom Health compliance requirements', 'Medium', current_date + 5, 'Open');
