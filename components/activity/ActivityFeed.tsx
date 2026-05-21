'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog, ActivityEntityType } from '@/types'
import { Building2, Users, Briefcase, CheckSquare, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ENTITY_CONFIG: Record<ActivityEntityType, { icon: React.ElementType; color: string; bg: string }> = {
  company: { icon: Building2, color: 'text-[#F72585]', bg: 'bg-[#F72585]/10' },
  contact: { icon: Users, color: 'text-[#4CC9F0]', bg: 'bg-[#4CC9F0]/10' },
  deal: { icon: Briefcase, color: 'text-violet-500', bg: 'bg-violet-50' },
  task: { icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
}

type FilterType = 'all' | ActivityEntityType

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'company', label: 'Companies' },
  { value: 'contact', label: 'Contacts' },
  { value: 'deal', label: 'Deals' },
  { value: 'task', label: 'Tasks' },
]

export default function ActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (filter !== 'all') query = query.eq('entity_type', filter)

    const { data } = await query
    setLogs((data ?? []) as ActivityLog[])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${logs.length} event${logs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              filter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#F72585] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <Activity size={20} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">No activity yet</p>
            <p className="text-xs text-gray-400 mt-1">Actions across your CRM will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {logs.map((log, i) => {
            const config = ENTITY_CONFIG[log.entity_type]
            const Icon = config.icon
            return (
              <div key={log.id} className={cn('flex items-start gap-4 px-5 py-4', i === 0 && 'rounded-t-2xl', i === logs.length - 1 && 'rounded-b-2xl')}>
                <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5', config.bg)}>
                  <Icon size={14} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{log.action}</span>
                    {log.entity_name && (
                      <> — <span className="font-semibold text-gray-900">{log.entity_name}</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
