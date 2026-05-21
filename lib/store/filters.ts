'use client'

import { create } from 'zustand'
import type { FilterState } from '@/types'

interface FilterStore extends FilterState {
  setIndustry: (v: string | null) => void
  setSizeRange: (v: string | null) => void
  setGlobalSearch: (v: string) => void
  clearFilters: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  industry: null,
  sizeRange: null,
  globalSearch: '',
  setIndustry: (industry) => set({ industry }),
  setSizeRange: (sizeRange) => set({ sizeRange }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  clearFilters: () => set({ industry: null, sizeRange: null, globalSearch: '' }),
}))
