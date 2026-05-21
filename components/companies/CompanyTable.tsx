'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFilterStore } from '@/lib/store/filters'
import type { Company } from '@/types'
import { Building2, ChevronUp, ChevronDown, Globe, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/shared/EmptyState'
import CompanyDrawer from './CompanyDrawer'
import CompanyCsvImport from './CsvImport'
import { cn } from '@/lib/utils'

type SortKey = 'name' | 'industry' | 'size_range' | 'created_at'
type SortDir = 'asc' | 'desc'

interface CompanyRow extends Company {
  contact_count: number
  open_deal_count: number
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

function formatDomain(url: string | null) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

export default function CompanyTable() {
  const { industry, sizeRange, globalSearch } = useFilterStore()

  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState<Company | null>(null)
  const [csvOpen, setCsvOpen] = useState(false)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    const supabase = createClient()
    let query = supabase.from('companies').select('*')

    if (industry) query = query.eq('industry', industry)
    if (sizeRange) query = query.eq('size_range', sizeRange)
    if (globalSearch) query = query.ilike('name', `%${globalSearch}%`)

    query = query.order(sortKey, { ascending: sortDir === 'asc' })

    const { data: rawCompanies, error } = await query
    if (error) {
      console.error('Companies fetch error:', error)
      setFetchError(error.message)
      setLoading(false)
      return
    }
    if (!rawCompanies) { setLoading(false); return }

    const ids = rawCompanies.map((c) => c.id)

    // Fetch contact counts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('company_id')
      .in('company_id', ids)

    // Fetch open deal counts
    const { data: deals } = await supabase
      .from('deals')
      .select('company_id')
      .in('company_id', ids)
      .not('stage', 'in', '("Closed Won","Closed Lost")')

    const contactCounts: Record<string, number> = {}
    const dealCounts: Record<string, number> = {}
    contacts?.forEach(({ company_id }) => {
      if (company_id) contactCounts[company_id] = (contactCounts[company_id] ?? 0) + 1
    })
    deals?.forEach(({ company_id }) => {
      if (company_id) dealCounts[company_id] = (dealCounts[company_id] ?? 0) + 1
    })

    setCompanies(rawCompanies.map((c) => ({
      ...c,
      contact_count: contactCounts[c.id] ?? 0,
      open_deal_count: dealCounts[c.id] ?? 0,
    })))
    setLoading(false)
  }, [industry, sizeRange, globalSearch, sortKey, sortDir])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  function toggleSort(col: SortKey) {
    if (col === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('asc') }
  }

  function openCreate() { setSelected(null); setDrawerOpen(true) }
  function openEdit(c: Company) { setSelected(c); setDrawerOpen(true) }

  const TH = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 group"
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
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`}
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
            New company
          </Button>
        </div>
      </div>

      {fetchError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          <strong>Failed to load companies:</strong> {fetchError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#F72585] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Add your first company or import from a CSV to get started."
            action={
              <Button onClick={openCreate} className="bg-[#F72585] hover:bg-[#FF5DA2] text-white gap-1.5">
                <Plus size={14} /> New company
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <TH col="name" label="Company" />
                  <TH col="industry" label="Industry" />
                  <TH col="size_range" label="Size" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Website</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacts</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Open Deals</th>
                  <TH col="created_at" label="Added" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => openEdit(company)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F72585]/10 flex-shrink-0">
                          <Building2 size={14} className="text-[#F72585]" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 group-hover:text-[#F72585] transition-colors">
                          {company.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {company.industry ? (
                        <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600 border-0">
                          {company.industry}
                        </Badge>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {company.size_range ? `${company.size_range} employees` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-sm text-[#4CC9F0] hover:underline"
                        >
                          <Globe size={12} />
                          {formatDomain(company.website)}
                        </a>
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                        company.contact_count > 0
                          ? 'bg-[#4CC9F0]/15 text-[#4CC9F0]'
                          : 'bg-gray-100 text-gray-400'
                      )}>
                        {company.contact_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                        company.open_deal_count > 0
                          ? 'bg-[#F72585]/15 text-[#F72585]'
                          : 'bg-gray-100 text-gray-400'
                      )}>
                        {company.open_deal_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-400">
                      {formatDate(company.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CompanyDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        company={selected}
        onSaved={fetchCompanies}
      />
      <CompanyCsvImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImported={fetchCompanies}
      />
    </div>
  )
}
