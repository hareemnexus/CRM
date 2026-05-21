import { createClient } from '@/lib/supabase/server'

interface ContactRow {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  role?: string | null
  company_name?: string | null
  lead_source?: string | null
  notes?: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { rows } = await request.json() as { rows: ContactRow[] }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  // Build a name→id map for companies
  const companyNames = [...new Set(rows.map((r) => r.company_name).filter(Boolean))] as string[]
  const companyMap: Record<string, string> = {}

  if (companyNames.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .in('name', companyNames)
    companies?.forEach(({ id, name }) => { companyMap[name] = id })
  }

  const validRows = rows.filter((r) => r.first_name?.trim() && r.last_name?.trim())

  // Fetch existing contacts by email to decide insert vs update
  const emails = validRows.map((r) => r.email?.trim()).filter(Boolean) as string[]
  const existingByEmail: Record<string, string> = {}

  if (emails.length > 0) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('id, email')
      .in('email', emails)
    existing?.forEach(({ id, email }) => { if (email) existingByEmail[email] = id })
  }

  let imported = 0
  const errors: string[] = []

  for (const row of validRows) {
    const payload = {
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      role: row.role?.trim() || null,
      company_id: row.company_name ? (companyMap[row.company_name] ?? null) : null,
      lead_source: row.lead_source?.trim() || null,
      notes: row.notes?.trim() || null,
    }
    const fullName = `${payload.first_name} ${payload.last_name}`
    const existingId = payload.email ? existingByEmail[payload.email] : null

    if (existingId) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', existingId)
      if (error) errors.push(`${fullName}: ${error.message}`)
      else imported++
    } else {
      const { error } = await supabase.from('contacts').insert({ ...payload, created_by: user.id })
      if (error) errors.push(`${fullName}: ${error.message}`)
      else imported++
    }
  }

  return Response.json({ imported, errors })
}
