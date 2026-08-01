import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/dal'
import { UserManagementBoard } from './_components/UserManagementBoard'
import { TopAppBar } from '@/components/layout/TopAppBar'
import { HomeTab } from './_components/HomeTab'
import { BottomNavBar } from './_components/BottomNavBar'
import { approveUser } from './_actions/action'
import { signOut } from '@/app/actions'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params?.tab || 'home'

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  await requireRole(user.id, 'admin')

  return (
    <>
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar signOut={signOut} />
          
          <main className="flex-1 p-4 space-y-6">
            {tab === 'home' && <HomeTab />}
            {tab === 'users' && <UserManagementBoard />}
            {tab !== 'home' && tab !== 'users' && (
              <div className="flex items-center justify-center h-64 text-slate-500">
                Content for {tab} coming soon.
              </div>
            )}
          </main>

          <BottomNavBar currentTab={tab} />
        </div>
      </div>
    </>
  )
}
