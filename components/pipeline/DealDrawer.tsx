'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import type { Deal, DealStage, Company, Contact } from '@/types'
import { DEAL_STAGES } from '@/types'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
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
  deal: Deal | null
  initialStage?: DealStage
  onSaved: () => void
}

const EMPTY: {
  name: string
  company_id: string
  contact_id: string
  stage: DealStage
  value: string
  currency: string
  notes: string
} = {
  name: '',
  company_id: '',
  contact_id: '',
  stage: 'Prospecting',
  value: '',
  currency: 'GBP',
  notes: '',
}

export default function DealDrawer({ open, onClose, deal, initialStage, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function set<K extends keyof typeof EMPTY>(key: K, value: typeof EMPTY[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (!open) return
    createClient().from('companies').select('id, name').order('name').then(({ data }) => {
      setCompanies((data ?? []) as Company[])
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
    if (deal) {
      setForm({
        name: deal.name,
        company_id: deal.company_id ?? '',
        contact_id: deal.contact_id ?? '',
        stage: deal.stage,
        value: deal.value ? String(deal.value) : '',
        currency: deal.currency ?? 'GBP',
        notes: deal.notes ?? '',
      })
    } else {
      setForm({ ...EMPTY, stage: initialStage ?? 'Prospecting' })
    }
    setConfirmDelete(false)
  }, [deal, open, initialStage])

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name.trim(),
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      stage: form.stage,
      value: parseFloat(form.value) || 0,
      currency: form.currency,
      notes: form.notes.trim() || null,
    }

    if (deal) {
      const { error } = await supabase.from('deals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', deal.id)
      if (!error) await logActivity(supabase, 'Updated deal', 'deal', deal.id, payload.name)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('deals').insert({ ...payload, created_by: user?.id }).select().single()
      if (!error && data) await logActivity(supabase, 'Created deal', 'deal', data.id, payload.name)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!deal) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', deal.id)
    await logActivity(supabase, 'Deleted deal', 'deal', deal.id, deal.name)
    setDeleting(false)
    onSaved()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-gray-100">
          <SheetTitle className="text-lg font-bold">{deal ? 'Edit Deal' : 'New Deal'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Deal name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Acme Corp — AI Setup" className="border-gray-200 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Stage</Label>
            <Select value={form.stage} onValueChange={(v) => set('stage', (v ?? 'Prospecting') as DealStage)}>
              <SelectTrigger className="border-gray-200 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map(s => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Value</Label>
              <Input value={form.value} onChange={(e) => set('value', e.target.value)} type="number" min="0" placeholder="0" className="border-gray-200 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => set('currency', v ?? 'GBP')}>
                <SelectTrigger className="border-gray-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GBP', 'USD', 'EUR'].map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

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
            <Label className="text-xs font-medium text-gray-600">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Add context, next steps…" className="border-gray-200 text-sm resize-none" rows={4} />
          </div>

          {deal && (
            <div className="pt-2 border-t border-gray-100">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} /> Delete deal
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

        <SheetFooter className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} className="flex-1 border-gray-200">Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 bg-[#F72585] hover:bg-[#FF5DA2] text-white">
            {saving ? 'Saving…' : deal ? 'Save changes' : 'Create deal'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
