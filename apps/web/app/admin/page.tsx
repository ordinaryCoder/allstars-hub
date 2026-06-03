import { createClient } from '../../lib/server'
import { redirect } from 'next/navigation'
import { requireRole } from '../../lib/dal'
import { prisma } from '../../../../packages/database'
import { UserManagementBoard } from '../../components/ui/admin/UserManagementBoard'
import { TopAppBar } from '../../components/ui/player/TopAppBar'
import { HomeTab } from '../../components/ui/admin/HomeTab'
import { BottomNavBar } from '../../components/ui/admin/BottomNavBar'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; view?: string }>
}) {
  const params = await searchParams
  const tab = params?.tab || 'home'
  const view = params?.view || 'pending'

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  await requireRole(user.id, 'admin')

  let pendingUsers: any[] = []
  let activeUsers: any[] = []

  if (tab === 'users') {
    pendingUsers = (await prisma.user.findMany({
      where: { status: 'PENDING' },
      include: { academy_roles: true },
      orderBy: { created_at: 'desc' },
    }));
    
    activeUsers = (await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      include: { academy_roles: true },
      orderBy: { created_at: 'desc' },
    }));
  }

  async function approveUser(formData: any) {
    'use server'

    const userId = formData.get('userId')?.toString()

    if (!userId) {
      redirect('/admin?tab=users')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    })

    redirect('/admin?tab=users')
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar signOut={signOut} />
          
          <main className="flex-1 p-4 space-y-6">
            {tab === 'home' && <HomeTab />}
            {tab === 'users' && (
              <UserManagementBoard 
                pendingUsers={pendingUsers} 
                activeUsers={activeUsers} 
                approveUser={approveUser} 
              />
            )}
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
