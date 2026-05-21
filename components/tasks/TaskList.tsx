'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import type { Task, TaskPriority } from '@/types'
import { CheckCircle2, Circle, Plus, Calendar, Building2, User, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import PriorityBadge from './PriorityBadge'
import TaskModal from './TaskModal'

const PRIORITY_ORDER: TaskPriority[] = ['High', 'Medium', 'Low']

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'Complete') return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'open' | 'complete' | 'all'>('open')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*, company:company_id(id, name), contact:contact_id(id, first_name, last_name), deal:deal_id(id, name)')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks((data ?? []) as Task[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function toggleStatus(task: Task) {
    const newStatus = task.status === 'Open' ? 'Complete' : 'Open'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    const supabase = createClient()
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (newStatus === 'Complete') {
      await logActivity(supabase, 'Completed task', 'task', task.id, task.title)
    }
  }

  function openCreate() { setSelectedTask(null); setModalOpen(true) }
  function openEdit(task: Task) { setSelectedTask(task); setModalOpen(true) }

  const filtered = tasks.filter(t => {
    if (filter === 'open') return t.status === 'Open'
    if (filter === 'complete') return t.status === 'Complete'
    return true
  })

  const grouped = PRIORITY_ORDER.reduce((acc, p) => {
    acc[p] = filtered.filter(t => t.priority === p)
    return acc
  }, {} as Record<TaskPriority, Task[]>)

  const openCount = tasks.filter(t => t.status === 'Open').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.status)).length

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${openCount} open${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5 bg-[#F72585] hover:bg-[#FF5DA2] text-white shadow-sm shadow-[#F72585]/20">
          <Plus size={14} /> New task
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['open', 'complete', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#F72585] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">
          {filter === 'open' ? "No open tasks — you're all caught up!" : 'No tasks here.'}
        </div>
      ) : (
        <div className="space-y-6">
          {PRIORITY_ORDER.map(priority => {
            const group = grouped[priority]
            if (!group.length) return null
            return (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-3">
                  <PriorityBadge priority={priority} />
                  <span className="text-xs text-gray-400">{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map(task => {
                    const overdue = isOverdue(task.due_date, task.status)
                    return (
                      <div
                        key={task.id}
                        onClick={() => openEdit(task)}
                        className={cn(
                          'bg-white rounded-xl border px-4 py-3.5 flex items-start gap-3 hover:shadow-sm transition-all cursor-pointer',
                          overdue
                            ? 'border-l-[3px] border-l-[#F72585] border-t-gray-100 border-r-gray-100 border-b-gray-100'
                            : 'border-gray-100',
                          task.status === 'Complete' ? 'opacity-60' : ''
                        )}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleStatus(task) }}
                          className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-[#F72585] transition-colors"
                        >
                          {task.status === 'Complete'
                            ? <CheckCircle2 size={18} className="text-green-500" />
                            : <Circle size={18} />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium text-gray-900',
                            task.status === 'Complete' && 'line-through text-gray-400'
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                            {task.due_date && (
                              <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-500 font-medium' : 'text-gray-400')}>
                                <Calendar size={11} />
                                {formatDate(task.due_date)}
                                {overdue && ' · Overdue'}
                              </span>
                            )}
                            {task.company && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Building2 size={11} />
                                {task.company.name}
                              </span>
                            )}
                            {task.contact && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <User size={11} />
                                {task.contact.first_name} {task.contact.last_name}
                              </span>
                            )}
                            {task.deal && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Briefcase size={11} />
                                {task.deal.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={selectedTask}
        onSaved={fetchTasks}
      />
    </div>
  )
}
