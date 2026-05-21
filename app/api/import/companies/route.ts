import { createClient } from '@/lib/supabase/server'

type SizeRange = '1-10' | '11-50' | '51-200' | '200+'

function normalizeSizeRange(raw: string | null | undefined): SizeRange | null {
  if (!raw) return null
  const s = raw.trim().toLowerCase().replace(/\s+employees?$/i, '').trim()

  // Exact matches
  if (s === '1-10') return '1-10'
  if (s === '11-50') return '11-50'
  if (s === '51-200') return '51-200'
  if (s === '200+' || s === '201+') return '200+'

  // Numeric — map to bracket
  const n = parseInt(s, 10)
  if (!isNaN(n)) {
    if (n <= 10) return '1-10'
    if (n <= 50) return '11-50'
    if (n <= 200) return '51-200'
    return '200+'
  }

  // Range like "51-500", "201-1000", "1000+" etc.
  const rangeMatch = s.match(/^(\d+)[-–](\d+)$/)
  if (rangeMatch) {
    const lo = parseInt(rangeMatch[1], 10)
    if (lo <= 10) return '1-10'
    if (lo <= 50) return '11-50'
    if (lo <= 200) return '51-200'
    return '200+'
  }

  // "500+" style
  const plusMatch = s.match(/^(\d+)\+$/)
  if (plusMatch) {
    const n2 = parseInt(plusMatch[1], 10)
    if (n2 <= 10) return '1-10'
    if (n2 <= 50) return '11-50'
    if (n2 <= 200) return '51-200'
    return '200+'
  }

  // Word labels
  if (/\bsmall\b/.test(s)) return '1-10'
  if (/\bmid\b|\bmedium\b/.test(s)) return '11-50'
  if (/\blarge\b/.test(s)) return '51-200'
  if (/\benterprise\b/.test(s)) return '200+'

  return null  // unrecognised — store as null rather than violate constraint
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { rows } = await request.json() as {
    rows: { name: string; industry?: string | null; size_range?: string | null; website?: string | null; notes?: string | null }[]
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const validRows = rows.filter((r) => r.name?.trim())
  const names = validRows.map((r) => r.name.trim())

  // Fetch existing companies by name to decide insert vs update
  const { data: existing } = await supabase
    .from('companies')
    .select('id, name')
    .in('name', names)

  const existingByName: Record<string, string> = {}
  existing?.forEach(({ id, name }) => { existingByName[name] = id })

  let imported = 0
  const errors: string[] = []

  for (const row of validRows) {
    const name = row.name.trim()
    const payload = { name, industry: row.industry ?? null, size_range: normalizeSizeRange(row.size_range), website: row.website ?? null, notes: row.notes ?? null }
    const existingId = existingByName[name]

    if (existingId) {
      const { error } = await supabase.from('companies').update(payload).eq('id', existingId)
      if (error) errors.push(`${name}: ${error.message}`)
      else imported++
    } else {
      const { error } = await supabase.from('companies').insert({ ...payload, created_by: user.id })
      if (error) errors.push(`${name}: ${error.message}`)
      else imported++
    }
  }

  return Response.json({ imported, errors })
}
