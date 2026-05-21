'use client'

import { useState, useEffect } from 'react'
import GlobalSearch from './GlobalSearch'

export default function GlobalSearchLoader() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <GlobalSearch />
}
