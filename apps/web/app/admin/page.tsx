import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/dal'
import { prisma } from '@packages/database'
import { UserManagementBoard } from './_components/UserManagementBoard'
import { TopAppBar } from '@/components/layout/TopAppBar'
import { HomeTab } from './_components/HomeTab'
import { BottomNavBar } from './_components/BottomNavBar'
import { signOut } from '@/app/(auth)/_actions/auth'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params?.tab || 'home'

  if (tab === 'create-session' || tab === 'schedule') {
    redirect('/admin/create-session')
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  await requireRole(user.id, 'admin')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { first_name: true, last_name: true },
  })

  const adminName = dbUser
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : (user.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : user.email || 'Admin')

  const adminInitials = dbUser
    ? `${dbUser.first_name?.[0] || ''}${dbUser.last_name?.[0] || ''}`.toUpperCase() || 'A'
    : (user.email?.[0] || 'A').toUpperCase()

  return (
    <>
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar userName={adminName} initials={adminInitials} signOut={signOut} />
          
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
