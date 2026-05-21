'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import type { Company } from '@/types'
import { INDUSTRIES, SIZE_RANGES } from '@/types'
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

interface CompanyDrawerProps {
  open: boolean
  onClose: () => void
  company: Company | null
  onSaved: () => void
}

export default function CompanyDrawer({ open, onClose, company, onSaved }: CompanyDrawerProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!company

  const [form, setForm] = useState<{
    name: string
    industry: string
    size_range: string
    website: string
    notes: string
  }>({
    name: '',
    industry: '',
    size_range: '',
    website: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        industry: company.industry ?? '',
        size_range: company.size_range ?? '',
        website: company.website ?? '',
        notes: company.notes ?? '',
      })
    } else {
      setForm({ name: '', industry: '', size_range: '', website: '', notes: '' })
    }
    setError(null)
  }, [company, open])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Company name is required')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      industry: form.industry || null,
      size_range: form.size_range || null,
      website: form.website.trim() || null,
      notes: form.notes.trim() || null,
    }

    if (isEdit && company) {
      const { error } = await supabase.from('companies').update(payload).eq('id', company.id)
      if (error) { setError(error.message); setSaving(false); return }
      await logActivity(supabase, 'Updated company', 'company', company.id, payload.name)
    } else {
      const { data, error } = await supabase.from('companies').insert(payload).select('id').single()
      if (error) { setError(error.message); setSaving(false); return }
      await logActivity(supabase, 'Created company', 'company', data.id, payload.name)
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!company || !confirm(`Delete "${company.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('companies').delete().eq('id', company.id)
    await logActivity(supabase, 'Deleted company', 'company', company.id, company.name)
    setDeleting(false)
    onSaved()
    onClose()
  }

  function viewContacts() {
    if (!company) return
    router.push(`/contacts?company_id=${company.id}`)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[440px] sm:w-[440px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <SheetTitle className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Company' : 'New Company'}
          </SheetTitle>
          {isEdit && (
            <button
              onClick={viewContacts}
              className="flex items-center gap-1.5 text-xs text-[#4CC9F0] hover:text-[#4CC9F0]/80 font-medium mt-1 w-fit"
            >
              <ExternalLink size={12} />
              View contacts
            </button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Company name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Acme Corp"
              className="border-gray-200 focus-visible:ring-[#F72585]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Industry</Label>
              <Select value={form.industry} onValueChange={(v) => set('industry', v ?? '')}>
                <SelectTrigger className="border-gray-200 focus:ring-[#F72585]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Company size</Label>
              <Select value={form.size_range} onValueChange={(v) => set('size_range', v ?? '')}>
                <SelectTrigger className="border-gray-200 focus:ring-[#F72585]">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_RANGES.map((s) => (
                    <SelectItem key={s} value={s}>{s} employees</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Website</Label>
            <Input
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://example.com"
              className="border-gray-200 focus-visible:ring-[#F72585]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Key context, next steps, anything relevant…"
              rows={4}
              className="border-gray-200 focus-visible:ring-[#F72585] resize-none"
            />
          </div>

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
                {deleting ? 'Deleting…' : 'Delete company'}
              </button>
            </>
          )}
          <SheetFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#F72585] hover:bg-[#FF5DA2] text-white"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create company'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
