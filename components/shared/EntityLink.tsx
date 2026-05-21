import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EntityLinkProps {
  href: string
  label: string
  variant?: 'company' | 'contact' | 'deal' | 'task'
}

const VARIANT_STYLES = {
  company: 'bg-[#F72585]/10 text-[#F72585] hover:bg-[#F72585]/20',
  contact: 'bg-[#4CC9F0]/10 text-[#4CC9F0] hover:bg-[#4CC9F0]/20',
  deal: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  task: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
}

export default function EntityLink({ href, label, variant = 'company' }: EntityLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
        VARIANT_STYLES[variant]
      )}
    >
      {label}
    </Link>
  )
}
