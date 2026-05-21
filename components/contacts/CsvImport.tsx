'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const CRM_FIELDS = [
  { key: 'first_name', label: 'First Name *' },
  { key: 'last_name', label: 'Last Name *' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Job Title' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'lead_source', label: 'Lead Source' },
  { key: 'notes', label: 'Notes' },
]

function autoDetect(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const lower = headers.map((h) => h.toLowerCase().trim())

  const matchers: Record<string, string[]> = {
    first_name: ['first name', 'first_name', 'firstname', 'given name', 'forename'],
    last_name: ['last name', 'last_name', 'lastname', 'surname', 'family name'],
    email: ['email', 'email address', 'e-mail'],
    phone: ['phone', 'mobile', 'telephone', 'tel', 'contact number'],
    role: ['role', 'title', 'job title', 'position', 'job', 'designation'],
    company_name: ['company', 'company name', 'organisation', 'organization', 'employer'],
    lead_source: ['source', 'lead source', 'channel', 'origin'],
    notes: ['notes', 'note', 'comments', 'description'],
  }

  for (const [field, keywords] of Object.entries(matchers)) {
    const idx = lower.findIndex((h) => keywords.includes(h))
    if (idx !== -1) mapping[field] = headers[idx]
  }

  return mapping
}

interface CsvImportProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export default function ContactCsvImport({ open, onClose, onImported }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = res.meta.fields ?? []
        setHeaders(hdrs)
        setRows(res.data)
        setMapping(autoDetect(hdrs))
        setResult(null)
      },
    })
  }

  function reset() {
    setHeaders([]); setRows([]); setMapping({}); setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleImport() {
    if (!mapping.first_name || !mapping.last_name) return
    setImporting(true)

    const mapped = rows.map((row) => ({
      first_name: row[mapping.first_name]?.trim(),
      last_name: row[mapping.last_name]?.trim(),
      email: mapping.email ? row[mapping.email]?.trim() || null : null,
      phone: mapping.phone ? row[mapping.phone]?.trim() || null : null,
      role: mapping.role ? row[mapping.role]?.trim() || null : null,
      company_name: mapping.company_name ? row[mapping.company_name]?.trim() || null : null,
      lead_source: mapping.lead_source ? row[mapping.lead_source]?.trim() || null : null,
      notes: mapping.notes ? row[mapping.notes]?.trim() || null : null,
    })).filter((r) => r.first_name && r.last_name)

    const res = await fetch('/api/import/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: mapped }),
    })
    const data = await res.json()
    setResult(data)
    setImporting(false)
    if (data.imported > 0) onImported()
  }

  function handleClose() { reset(); onClose() }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        {!headers.length ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl py-12 cursor-pointer hover:border-[#F72585]/40 hover:bg-[#F72585]/5 transition-colors"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100">
              <Upload size={20} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Click to upload a CSV file</p>
              <p className="text-xs text-gray-400 mt-1">Columns: first_name, last_name, email, phone, company, role…</p>
            </div>
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{rows.length}</span> rows detected. Map your columns:
              </p>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X size={12} /> Change file
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CRM_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">{label}</p>
                  <Select value={mapping[key] ?? ''} onValueChange={(v) => setMapping((m) => ({ ...m, [key]: v ?? '' }))}>
                    <SelectTrigger className="h-8 text-xs border-gray-200">
                      <SelectValue placeholder="— skip —" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <p className="text-xs font-medium text-gray-500 px-3 py-2 bg-gray-50 border-b border-gray-100">Preview (first 3 rows)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {CRM_FIELDS.filter((f) => mapping[f.key]).map(({ key, label }) => (
                        <th key={key} className="text-left px-3 py-2 text-gray-500 font-medium">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        {CRM_FIELDS.filter((f) => mapping[f.key]).map(({ key }) => (
                          <td key={key} className="px-3 py-2 text-gray-700 truncate max-w-[100px]">
                            {row[mapping[key]] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {result && (
              <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${result.errors.length === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {result.errors.length === 0
                  ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                  : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-medium">{result.imported} contacts imported</p>
                  {result.errors.length > 0 && <p className="text-xs mt-0.5">{result.errors[0]}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="border-gray-200">Cancel</Button>
          {headers.length > 0 && !result && (
            <Button
              onClick={handleImport}
              disabled={importing || !mapping.first_name || !mapping.last_name}
              className="bg-[#F72585] hover:bg-[#FF5DA2] text-white"
            >
              {importing ? 'Importing…' : `Import ${rows.length} contacts`}
            </Button>
          )}
          {result && <Button onClick={handleClose} className="bg-[#F72585] hover:bg-[#FF5DA2] text-white">Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
