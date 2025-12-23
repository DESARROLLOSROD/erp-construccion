import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Header user={session.user} />
        <main className="p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
