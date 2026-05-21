'use client'

import { useState } from 'react'
import type { Deal, DealStage } from '@/types'
import { DEAL_STAGES } from '@/types'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGE_COLORS: Record<DealStage, string> = {
  'Prospecting': 'bg-gray-100 text-gray-600',
  'Contacted': 'bg-blue-50 text-blue-600',
  'Meeting Booked': 'bg-indigo-50 text-indigo-600',
  'Proposal Sent': 'bg-violet-50 text-violet-600',
  'Negotiation': 'bg-amber-50 text-amber-600',
  'Closed Won': 'bg-green-50 text-green-700',
  'Closed Lost': 'bg-red-50 text-red-600',
}

function formatValue(value: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type SortKey = 'name' | 'stage' | 'value' | 'created_at'
type SortDir = 'asc' | 'desc'

interface Props {
  deals: Deal[]
  onDealClick: (deal: Deal) => void
}

export default function PipelineListView({ deals, onDealClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(col: SortKey) {
    if (col === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('asc') }
  }

  const sorted = [...deals].sort((a, b) => {
    let av: string | number
    let bv: string | number
    if (sortKey === 'stage') {
      av = DEAL_STAGES.indexOf(a.stage)
      bv = DEAL_STAGES.indexOf(b.stage)
    } else {
      av = a[sortKey] as string | number
      bv = b[sortKey] as string | number
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <ChevronUp size={12} className="text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[#F72585]" />
      : <ChevronDown size={12} className="text-[#F72585]" />
  }

  function TH({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-1">{label}<SortIcon col={col} /></span>
      </th>
    )
  }

  if (sorted.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center py-20 text-sm text-gray-400">
      No deals match the current filters.
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50/50">
            <tr>
              <TH col="name" label="Deal" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
              <TH col="stage" label="Stage" />
              <TH col="value" label="Value" />
              <TH col="created_at" label="Created" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(deal => (
              <tr key={deal.id} onClick={() => onDealClick(deal)} className="hover:bg-gray-50/80 cursor-pointer transition-colors">
                <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{deal.name}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">
                  {deal.company?.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-600">
                  {deal.contact
                    ? `${deal.contact.first_name} ${deal.contact.last_name}`
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <Badge className={cn('text-xs font-medium border-0', STAGE_COLORS[deal.stage])}>{deal.stage}</Badge>
                </td>
                <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">
                  {formatValue(deal.value, deal.currency)}
                </td>
                <td className="px-4 py-3.5 text-sm text-gray-400">{formatDate(deal.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
