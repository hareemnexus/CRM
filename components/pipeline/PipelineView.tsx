'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import { useFilterStore } from '@/lib/store/filters'
import type { Deal, DealStage } from '@/types'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import KanbanBoard from './KanbanBoard'
import PipelineListView from './PipelineListView'
import DealDrawer from './DealDrawer'

export default function PipelineView() {
  const { industry, sizeRange, globalSearch } = useFilterStore()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('deals')
      .select('*, company:company_id(id, name, industry, size_range), contact:contact_id(id, first_name, last_name)')
      .order('created_at', { ascending: false })

    let filtered = (data ?? []) as Deal[]
    if (industry) filtered = filtered.filter(d => d.company?.industry === industry)
    if (sizeRange) filtered = filtered.filter(d => d.company?.size_range === sizeRange)
    if (globalSearch) {
      const q = globalSearch.toLowerCase()
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.company?.name ?? '').toLowerCase().includes(q) ||
        `${d.contact?.first_name ?? ''} ${d.contact?.last_name ?? ''}`.toLowerCase().includes(q)
      )
    }

    setDeals(filtered)
    setLoading(false)
  }, [industry, sizeRange, globalSearch])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  async function handleStageChange(dealId: string, newStage: DealStage) {
    const deal = deals.find(d => d.id === dealId)
    if (!deal || deal.stage === newStage) return

    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage, updated_at: new Date().toISOString() } : d))

    const supabase = createClient()
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', dealId)

    if (error) {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: deal.stage } : d))
    } else {
      await logActivity(supabase, `Moved to ${newStage}`, 'deal', dealId, deal.name)
    }
  }

  function openCreate() { setSelectedDeal(null); setDrawerOpen(true) }
  function openEdit(deal: Deal) { setSelectedDeal(deal); setDrawerOpen(true) }

  const openValue = deals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? 'Loading…'
              : `${deals.length} deal${deals.length !== 1 ? 's' : ''} · ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(openValue)} open`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={13} /> List
            </button>
          </div>
          <Button
            size="sm"
            onClick={openCreate}
            className="gap-1.5 bg-[#F72585] hover:bg-[#FF5DA2] text-white shadow-sm shadow-[#F72585]/20"
          >
            <Plus size={14} /> New deal
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#F72585] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        <KanbanBoard
          deals={deals}
          onDealClick={openEdit}
          onStageChange={handleStageChange}
          activeDragId={activeDragId}
          onDragStart={setActiveDragId}
          onDragEnd={() => setActiveDragId(null)}
        />
      ) : (
        <PipelineListView deals={deals} onDealClick={openEdit} />
      )}

      <DealDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        deal={selectedDeal}
        onSaved={fetchDeals}
      />
    </div>
  )
}
