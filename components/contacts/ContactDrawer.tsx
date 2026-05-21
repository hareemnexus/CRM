'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import type { Contact, Company, Deal, Task } from '@/types'
import { LEAD_SOURCES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface ContactDrawerProps {
  open: boolean
  onClose: () => void
  contact: Contact | null
  onSaved: () => void
}

export default function ContactDrawer({ open, onClose, contact, onSaved }: ContactDrawerProps) {
  const supabase = createClient()
  const isEdit = !!contact

  const [form, setForm] = useState<{
    first_name: string
    last_name: string
    email: string
    phone: string
    role: string
    company_id: string
    lead_source: string
    notes: string
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    company_id: '',
    lead_source: '',
    notes: '',
  })
  const [companies, setCompanies] = useState<Pick<Company, 'id' | 'name'>[]>([])
  const [linkedDeals, setLinkedDeals] = useState<Deal[]>([])
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load companies for the dropdown
  useEffect(() => {
    supabase.from('companies').select('id, name').order('name').then(({ data }) => {
      setCompanies(data ?? [])
    })
  }, [])

  // Populate form + load linked records when contact changes
  useEffect(() => {
    if (contact) {
      setForm({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        role: contact.role ?? '',
        company_id: contact.company_id ?? '',
        lead_source: contact.lead_source ?? '',
        notes: contact.notes ?? '',
      })
      // Load linked deals and tasks
      supabase
        .from('deals')
        .select('id, name, stage, value, currency')
        .eq('contact_id', contact.id)
        .then(({ data }) => setLinkedDeals((data as Deal[]) ?? []))

      supabase
        .from('tasks')
        .select('id, title, priority, status, due_date')
        .eq('contact_id', contact.id)
        .then(({ data }) => setLinkedTasks((data as Task[]) ?? []))
    } else {
      setForm({ first_name: '', last_name: '', email: '', phone: '', role: '', company_id: '', lead_source: '', notes: '' })
      setLinkedDeals([])
      setLinkedTasks([])
    }
    setError(null)
  }, [contact, open])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role.trim() || null,
      company_id: form.company_id || null,
      lead_source: form.lead_source || null,
      notes: form.notes.trim() || null,
    }
    const fullName = `${payload.first_name} ${payload.last_name}`

    if (isEdit && contact) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id)
      if (error) { setError(error.message); setSaving(false); return }
      await logActivity(supabase, 'Updated contact', 'contact', contact.id, fullName)
    } else {
      const { data, error } = await supabase.from('contacts').insert(payload).select('id').single()
      if (error) { setError(error.message); setSaving(false); return }
      await logActivity(supabase, 'Created contact', 'contact', data.id, fullName)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!contact || !confirm(`Delete "${contact.first_name} ${contact.last_name}"? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('contacts').delete().eq('id', contact.id)
    await logActivity(supabase, 'Deleted contact', 'contact', contact.id, `${contact.first_name} ${contact.last_name}`)
    setDeleting(false)
    onSaved()
    onClose()
  }

  const STAGE_COLORS: Record<string, string> = {
    'Prospecting': 'bg-gray-100 text-gray-600',
    'Contacted': 'bg-blue-50 text-blue-600',
    'Meeting Booked': 'bg-[#4CC9F0]/10 text-[#4CC9F0]',
    'Proposal Sent': 'bg-purple-50 text-purple-600',
    'Negotiation': 'bg-amber-50 text-amber-600',
    'Closed Won': 'bg-green-50 text-green-600',
    'Closed Lost': 'bg-red-50 text-red-500',
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[480px] sm:w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <SheetTitle className="text-lg font-bold text-gray-900">
            {isEdit ? `${contact.first_name} ${contact.last_name}` : 'New Contact'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">First name *</Label>
              <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)}
                placeholder="Jane" className="border-gray-200 focus-visible:ring-[#F72585]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Last name *</Label>
              <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)}
                placeholder="Smith" className="border-gray-200 focus-visible:ring-[#F72585]" />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="jane@company.com" className="border-gray-200 focus-visible:ring-[#F72585]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Phone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="+44 7700 900000" className="border-gray-200 focus-visible:ring-[#F72585]" />
            </div>
          </div>

          {/* Role & Company */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Job title</Label>
              <Input value={form.role} onChange={(e) => set('role', e.target.value)}
                placeholder="CEO" className="border-gray-200 focus-visible:ring-[#F72585]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Company</Label>
              <Select value={form.company_id} onValueChange={(v) => set('company_id', v ?? '')}>
                <SelectTrigger className="border-gray-200 focus:ring-[#F72585]">
                  <SelectValue placeholder="Select company…" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead Source */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Lead source</Label>
            <Select value={form.lead_source} onValueChange={(v) => set('lead_source', v ?? '')}>
              <SelectTrigger className="border-gray-200 focus:ring-[#F72585]">
                <SelectValue placeholder="Where did this lead come from?" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Key context, next steps, background…"
              rows={3}
              className="border-gray-200 focus-visible:ring-[#F72585] resize-none"
            />
          </div>

          {/* Linked Deals */}
          {isEdit && linkedDeals.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Linked deals</p>
              <div className="space-y-1.5">
                {linkedDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-sm font-medium text-gray-800">{deal.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">
                        £{deal.value.toLocaleString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                        {deal.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked Tasks */}
          {isEdit && linkedTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Linked tasks</p>
              <div className="space-y-1.5">
                {linkedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <span className={`text-sm font-medium ${task.status === 'Complete' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    <Badge
                      className={`text-xs border-0 ${
                        task.priority === 'High' ? 'bg-red-50 text-red-500' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          {isEdit && (
            <>
              <Separator className="mb-4" />
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 font-medium mb-4 transition-colors"
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete contact'}
              </button>
            </>
          )}
          <SheetFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-gray-200">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#F72585] hover:bg-[#FF5DA2] text-white"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create contact'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
