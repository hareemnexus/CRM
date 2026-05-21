'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import type { Task, TaskPriority, Company, Contact, Deal } from '@/types'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
  onSaved: () => void
}

const EMPTY: {
  title: string
  description: string
  priority: TaskPriority
  due_date: string
  company_id: string
  contact_id: string
  deal_id: string
} = {
  title: '',
  description: '',
  priority: 'Medium',
  due_date: '',
  company_id: '',
  contact_id: '',
  deal_id: '',
}

export default function TaskModal({ open, onClose, task, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set<K extends keyof typeof EMPTY>(key: K, value: typeof EMPTY[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('deals').select('id, name').order('name'),
    ]).then(([{ data: cos }, { data: dls }]) => {
      setCompanies((cos ?? []) as Company[])
      setDeals((dls ?? []) as Deal[])
    })
  }, [open])

  useEffect(() => {
    if (!form.company_id) { setContacts([]); return }
    createClient()
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('company_id', form.company_id)
      .order('first_name')
      .then(({ data }) => setContacts((data ?? []) as Contact[]))
  }, [form.company_id])

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        due_date: task.due_date ?? '',
        company_id: task.company_id ?? '',
        contact_id: task.contact_id ?? '',
        deal_id: task.deal_id ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setConfirmDelete(false)
  }, [task, open])

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      due_date: form.due_date || null,
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
    }

    if (task) {
      await supabase.from('tasks').update(payload).eq('id', task.id)
      await logActivity(supabase, 'Updated task', 'task', task.id, payload.title)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('tasks').insert({ ...payload, created_by: user?.id, assigned_to: user?.id }).select().single()
      if (data) await logActivity(supabase, 'Created task', 'task', data.id, payload.title)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!task) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', task.id)
    await logActivity(supabase, 'Deleted task', 'task', task.id, task.title)
    setDeleting(false)
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Title *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Follow up with James" className="border-gray-200 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', (v ?? 'Medium') as TaskPriority)}>
                <SelectTrigger className="border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['High', 'Medium', 'Low'] as TaskPriority[]).map(p => (
                    <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Due date</Label>
              <Input value={form.due_date} onChange={(e) => set('due_date', e.target.value)} type="date" className="border-gray-200 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional context or steps…" className="border-gray-200 text-sm resize-none" rows={3} />
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Link to</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Company</Label>
              <Select value={form.company_id} onValueChange={(v) => { set('company_id', v ?? ''); set('contact_id', '') }}>
                <SelectTrigger className="border-gray-200 text-sm"><SelectValue placeholder="— none —" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-600">Contact</Label>
                <Select value={form.contact_id} onValueChange={(v) => set('contact_id', v ?? '')}>
                  <SelectTrigger className="border-gray-200 text-sm"><SelectValue placeholder="— none —" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.first_name} {c.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Deal</Label>
              <Select value={form.deal_id} onValueChange={(v) => set('deal_id', v ?? '')}>
                <SelectTrigger className="border-gray-200 text-sm"><SelectValue placeholder="— none —" /></SelectTrigger>
                <SelectContent>
                  {deals.map(d => <SelectItem key={d.id} value={d.id} className="text-sm">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {task && (
            <div className="pt-2 border-t border-gray-100">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} /> Delete task
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Are you sure?</span>
                  <button onClick={handleDelete} disabled={deleting} className="text-xs font-medium text-red-500 hover:text-red-700">
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-200">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-[#F72585] hover:bg-[#FF5DA2] text-white">
            {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
