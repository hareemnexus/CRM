'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFilterStore } from '@/lib/store/filters'
import type { Contact } from '@/types'
import { Users, ChevronUp, ChevronDown, Plus, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/shared/EmptyState'
import ContactDrawer from './ContactDrawer'
import ContactCsvImport from './CsvImport'
import { cn } from '@/lib/utils'

type SortKey = 'first_name' | 'email' | 'role' | 'lead_source' | 'created_at'
type SortDir = 'asc' | 'desc'

const SOURCE_COLORS: Record<string, string> = {
  'LinkedIn': 'bg-blue-50 text-blue-600',
  'Cold Email': 'bg-[#F72585]/10 text-[#F72585]',
  'Referral': 'bg-green-50 text-green-600',
  'Inbound': 'bg-[#4CC9F0]/10 text-[#4CC9F0]',
  'Other': 'bg-gray-100 text-gray-500',
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={12} className="text-gray-300" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-[#F72585]" />
    : <ChevronDown size={12} className="text-[#F72585]" />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(c: Contact) {
  return `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
}

const AVATAR_COLORS = [
  'bg-[#F72585]/20 text-[#F72585]',
  'bg-[#4CC9F0]/20 text-[#4CC9F0]',
  'bg-purple-100 text-purple-600',
  'bg-amber-100 text-amber-600',
  'bg-green-100 text-green-600',
]

function avatarColor(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

export default function ContactTable() {
  const { industry, sizeRange, globalSearch } = useFilterStore()
  const searchParams = useSearchParams()
  const companyIdFilter = searchParams.get('company_id')
  const supabase = createClient()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)

  // Fetch company name when filtering by company
  useEffect(() => {
    if (!companyIdFilter) { setCompanyName(null); return }
    supabase.from('companies').select('name').eq('id', companyIdFilter).single()
      .then(({ data }) => setCompanyName(data?.name ?? null))
  }, [companyIdFilter])

  const fetchContacts = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('contacts')
      .select('*, company:companies(id, name, industry, size_range)')

    if (companyIdFilter) {
      query = query.eq('company_id', companyIdFilter)
    } else {
      if (industry) query = query.eq('company.industry', industry)
      if (sizeRange) query = query.eq('company.size_range', sizeRange)
    }

    if (globalSearch) {
      query = query.or(`first_name.ilike.%${globalSearch}%,last_name.ilike.%${globalSearch}%,email.ilike.%${globalSearch}%`)
    }

    query = query.order(sortKey, { ascending: sortDir === 'asc' })

    const { data } = await query
    setContacts((data as Contact[]) ?? [])
    setLoading(false)
  }, [companyIdFilter, industry, sizeRange, globalSearch, sortKey, sortDir])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  function toggleSort(col: SortKey) {
    if (col === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('asc') }
  }

  function openCreate() { setSelected(null); setDrawerOpen(true) }
  function openEdit(c: Contact) { setSelected(c); setDrawerOpen(true) }

  const TH = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  )

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            {companyName && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F72585]/10 text-[#F72585] rounded-full text-sm font-medium">
                {companyName}
                <button
                  onClick={() => window.history.pushState({}, '', '/contacts')}
                  className="hover:text-[#F72585]/70"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${contacts.length} ${contacts.length === 1 ? 'contact' : 'contacts'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCsvOpen(true)}
            className="gap-1.5 border-gray-200 text-gray-600 hover:text-gray-900"
          >
            <Upload size={14} />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            className="gap-1.5 bg-[#F72585] hover:bg-[#FF5DA2] text-white shadow-sm shadow-[#F72585]/20"
          >
            <Plus size={14} />
            New contact
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#F72585] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            description="Add your first contact or import from CSV."
            action={
              <Button onClick={openCreate} className="bg-[#F72585] hover:bg-[#FF5DA2] text-white gap-1.5">
                <Plus size={14} /> New contact
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <TH col="first_name" label="Name" />
                  <TH col="email" label="Email" />
                  <TH col="role" label="Role" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                  <TH col="lead_source" label="Source" />
                  <TH col="created_at" label="Added" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => openEdit(contact)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0',
                          avatarColor(contact.id)
                        )}>
                          {initials(contact)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-[#F72585] transition-colors">
                            {contact.first_name} {contact.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {contact.email ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {contact.role ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {contact.company ? (
                        <span className="text-sm font-medium text-gray-700">{contact.company.name}</span>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {contact.lead_source ? (
                        <Badge className={cn('text-xs border-0 font-medium', SOURCE_COLORS[contact.lead_source] ?? 'bg-gray-100 text-gray-500')}>
                          {contact.lead_source}
                        </Badge>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-400">
                      {formatDate(contact.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ContactDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        contact={selected}
        onSaved={fetchContacts}
      />
      <ContactCsvImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImported={fetchContacts}
      />
    </div>
  )
}
