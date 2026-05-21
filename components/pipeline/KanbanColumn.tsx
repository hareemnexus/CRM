'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Deal, DealStage } from '@/types'
import DealCard from './DealCard'
import { cn } from '@/lib/utils'

function formatValue(value: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
}

interface Props {
  stage: DealStage
  deals: Deal[]
  onCardClick: (deal: Deal) => void
}

export default function KanbanColumn({ stage, deals, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = deals.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">{stage}</h3>
        <span className="text-xs bg-gray-100 text-gray-500 font-semibold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
          {deals.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 space-y-2 min-h-[300px] transition-colors',
          isOver ? 'bg-[#F72585]/5 ring-1 ring-[#F72585]/20' : 'bg-gray-50'
        )}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onClick={onCardClick} />
        ))}
      </div>
      {total > 0 && (
        <div className="mt-2 px-0.5">
          <span className="text-xs font-bold text-[#4CC9F0]">{formatValue(total)}</span>
        </div>
      )}
    </div>
  )
}
