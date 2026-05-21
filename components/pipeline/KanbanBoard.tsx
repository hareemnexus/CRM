'use client'

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core'
import type { Deal, DealStage } from '@/types'
import { DEAL_STAGES } from '@/types'
import KanbanColumn from './KanbanColumn'
import DealCard from './DealCard'

interface Props {
  deals: Deal[]
  onDealClick: (deal: Deal) => void
  onStageChange: (dealId: string, newStage: DealStage) => void
  activeDragId: string | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

export default function KanbanBoard({ deals, onDealClick, onStageChange, activeDragId, onDragStart, onDragEnd }: Props) {
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(d => d.stage === stage)
    return acc
  }, {} as Record<DealStage, Deal[]>)

  const activeDeal = activeDragId ? deals.find(d => d.id === activeDragId) ?? null : null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    onDragEnd()
    if (!over) return
    onStageChange(active.id as string, over.id as DealStage)
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={(e: DragStartEvent) => onDragStart(e.active.id as string)}
      onDragEnd={handleDragEnd}
      onDragCancel={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {DEAL_STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage]}
            onCardClick={onDealClick}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDeal && <DealCard deal={activeDeal} onClick={() => {}} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
