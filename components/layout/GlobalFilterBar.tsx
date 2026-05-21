'use client'

import { Filter, X, Search } from 'lucide-react'
import { useFilterStore } from '@/lib/store/filters'
import { INDUSTRIES, SIZE_RANGES } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function GlobalFilterBar() {
  const { industry, sizeRange, globalSearch, setIndustry, setSizeRange, setGlobalSearch, clearFilters } = useFilterStore()
  const hasFilters = industry !== null || sizeRange !== null || globalSearch !== ''

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-white border-b border-gray-100">
      {/* Search */}
      <div className="relative flex-shrink-0">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <Input
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search…"
          className="h-8 pl-8 w-48 text-xs border-gray-200 focus-visible:ring-[#F72585]"
        />
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <div className="flex items-center gap-1.5 text-gray-400 text-xs">
        <Filter size={13} />
        <span className="font-medium">Filter</span>
      </div>

      <Select value={industry ?? ''} onValueChange={(v) => setIndustry(v ?? null)}>
        <SelectTrigger className="h-8 w-40 text-xs border-gray-200 focus:ring-[#F72585]">
          <SelectValue placeholder="All industries" />
        </SelectTrigger>
        <SelectContent>
          {INDUSTRIES.map((ind) => (
            <SelectItem key={ind} value={ind} className="text-xs">{ind}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sizeRange ?? ''} onValueChange={(v) => setSizeRange(v ?? null)}>
        <SelectTrigger className="h-8 w-36 text-xs border-gray-200 focus:ring-[#F72585]">
          <SelectValue placeholder="Company size" />
        </SelectTrigger>
        <SelectContent>
          {SIZE_RANGES.map((size) => (
            <SelectItem key={size} value={size} className="text-xs">{size} employees</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2 text-xs text-gray-400 hover:text-gray-700 gap-1"
        >
          <X size={12} />
          Clear all
        </Button>
      )}

      <div className="ml-auto flex items-center gap-3">
        {hasFilters && (
          <span className="text-xs text-[#F72585] font-medium">Filters active</span>
        )}
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded-md border border-gray-200 font-mono">
          ⌘K
        </kbd>
      </div>
    </div>
  )
}
