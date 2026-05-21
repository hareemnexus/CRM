import type { TaskPriority } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<TaskPriority, string> = {
  High: 'bg-[#F72585]/10 text-[#F72585]',
  Medium: 'bg-amber-50 text-amber-600',
  Low: 'bg-gray-100 text-gray-500',
}

export default function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', CONFIG[priority])}>
      {priority}
    </span>
  )
}
