import Sidebar from '@/components/layout/Sidebar'
import GlobalFilterBar from '@/components/layout/GlobalFilterBar'
import GlobalSearchLoader from '@/components/layout/GlobalSearchLoader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-60 min-w-0">
        <GlobalFilterBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <GlobalSearchLoader />
    </div>
  )
}
