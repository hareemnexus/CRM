'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Deal } from '@/types'
import { Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

function daysInStage(updatedAt: string) {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000)
}

function formatValue(value: number, currency: string) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

interface Props {
  deal: Deal
  onClick: (deal: Deal) => void
  overlay?: boolean
}

export default function DealCard({ deal, onClick, overlay }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  const days = daysInStage(deal.updated_at)

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : { ...listeners, ...attributes })}
      onClick={(e) => { e.stopPropagation(); onClick(deal) }}
      className={cn(
        'bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing shadow-sm space-y-2.5 transition-all select-none',
        isDragging && !overlay ? 'opacity-40' : '',
        overlay
          ? 'shadow-xl shadow-[#F72585]/20 border-[#F72585]/30 ring-1 ring-[#F72585]/20 rotate-1'
          : 'border-gray-100 hover:shadow-md hover:border-gray-200'
      )}
    >
      <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{deal.name}</p>
      <div className="space-y-1">
        {deal.company && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 size={11} className="flex-shrink-0" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
        {deal.contact && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User size={11} className="flex-shrink-0" />
            <span className="truncate">{deal.contact.first_name} {deal.contact.last_name}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-sm font-bold text-gray-900">{formatValue(deal.value, deal.currency)}</span>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          days > 14 ? 'bg-red-50 text-red-500' : days > 7 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
        )}>
          {days}d
        </span>
      </div>
    </div>
  )
}
