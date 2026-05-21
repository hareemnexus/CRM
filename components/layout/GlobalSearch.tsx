'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFilterStore } from '@/lib/store/filters'
import { Building2, Users, Briefcase } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

interface Result {
  id: string
  name: string
  sub: string
  type: 'company' | 'contact' | 'deal'
  href: string
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setGlobalSearch } = useFilterStore()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(prev => prev.length ? [] : prev); return }
    setLoading(true)
    const supabase = createClient()
    const p = q.replace(/[%_]/g, '\\$&')

    const [{ data: companies }, { data: contacts }, { data: deals }] = await Promise.all([
      supabase.from('companies').select('id, name, industry').ilike('name', `%${p}%`).limit(5),
      supabase.from('contacts').select('id, first_name, last_name, email')
        .or(`first_name.ilike.%${p}%,last_name.ilike.%${p}%,email.ilike.%${p}%`).limit(5),
      supabase.from('deals').select('id, name, stage').ilike('name', `%${p}%`).limit(5),
    ])

    const res: Result[] = [
      ...(companies ?? []).map(c => ({
        id: c.id, name: c.name, sub: c.industry ?? 'Company', type: 'company' as const, href: '/companies',
      })),
      ...(contacts ?? []).map(c => ({
        id: c.id, name: `${c.first_name} ${c.last_name}`, sub: c.email ?? 'Contact', type: 'contact' as const, href: '/contacts',
      })),
      ...(deals ?? []).map(d => ({
        id: d.id, name: d.name, sub: d.stage, type: 'deal' as const, href: '/pipeline',
      })),
    ]
    setResults(res)
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250)
    return () => clearTimeout(t)
  }, [query, runSearch])

  function handleSelect(result: Result) {
    setOpen(false)
    setQuery('')
    setGlobalSearch(result.name)
    router.push(result.href)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) setQuery('')
  }

  const companies = results.filter(r => r.type === 'company')
  const contacts = results.filter(r => r.type === 'contact')
  const deals = results.filter(r => r.type === 'deal')

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Search" description="Search across your CRM">
      <CommandInput
        placeholder="Search companies, contacts, deals…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!loading && query.trim() && results.length === 0 && (
          <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
        )}
        {companies.length > 0 && (
          <CommandGroup heading="Companies">
            {companies.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r)} className="gap-3 py-2">
                <Building2 size={14} className="text-[#F72585] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {contacts.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r)} className="gap-3 py-2">
                <Users size={14} className="text-[#4CC9F0] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {deals.length > 0 && (
          <CommandGroup heading="Deals">
            {deals.map(r => (
              <CommandItem key={r.id} onSelect={() => handleSelect(r)} className="gap-3 py-2">
                <Briefcase size={14} className="text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!query.trim() && (
          <div className="px-3 py-4">
            <p className="text-xs text-gray-400 text-center">Type to search across companies, contacts, and deals</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
}
