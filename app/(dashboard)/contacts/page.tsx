import { Suspense } from 'react'
import ContactTable from '@/components/contacts/ContactTable'

export default function ContactsPage() {
  return (
    <Suspense>
      <ContactTable />
    </Suspense>
  )
}
