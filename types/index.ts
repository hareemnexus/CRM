export interface Company {
  id: string
  name: string
  industry: string | null
  size_range: string | null
  website: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string | null
  company_id: string | null
  lead_source: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  company?: Pick<Company, 'id' | 'name' | 'industry' | 'size_range'>
}

export type DealStage =
  | 'Prospecting'
  | 'Contacted'
  | 'Meeting Booked'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost'

export const DEAL_STAGES: DealStage[] = [
  'Prospecting',
  'Contacted',
  'Meeting Booked',
  'Proposal Sent',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
]

export interface Deal {
  id: string
  name: string
  company_id: string | null
  contact_id: string | null
  stage: DealStage
  value: number
  currency: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  company?: Pick<Company, 'id' | 'name' | 'industry' | 'size_range'>
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name'>
}

export type TaskPriority = 'High' | 'Medium' | 'Low'
export type TaskStatus = 'Open' | 'Complete'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: TaskPriority
  due_date: string | null
  status: TaskStatus
  assigned_to: string | null
  company_id: string | null
  contact_id: string | null
  deal_id: string | null
  created_by: string | null
  created_at: string
  company?: Pick<Company, 'id' | 'name'>
  contact?: Pick<Contact, 'id' | 'first_name' | 'last_name'>
  deal?: Pick<Deal, 'id' | 'name'>
}

export type ActivityEntityType = 'company' | 'contact' | 'deal' | 'task'

export interface ActivityLog {
  id: string
  action: string
  entity_type: ActivityEntityType
  entity_id: string
  entity_name: string | null
  user_id: string | null
  created_at: string
}

export interface FilterState {
  industry: string | null
  sizeRange: string | null
  globalSearch: string
}

export const INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'Real Estate',
  'Healthcare',
  'Finance',
  'Marketing',
  'Recruitment',
  'Legal',
  'Education',
  'Manufacturing',
  'Consulting',
  'Other',
]

export const SIZE_RANGES = ['1-10', '11-50', '51-200', '200+']

export const LEAD_SOURCES = [
  'LinkedIn',
  'Cold Email',
  'Referral',
  'Inbound',
  'Other',
]
