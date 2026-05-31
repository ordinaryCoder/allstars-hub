import { createClient } from '../../lib/server'
import { redirect } from 'next/navigation'
import { requireRole } from '../../lib/dal'
import { prisma } from '../../../../packages/database'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  await requireRole(user.id, 'admin')

  const pendingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' },
    include: { academy_roles: true },
    orderBy: { created_at: 'desc' },
  })

  async function approveUser(formData) {
    'use server'

    const userId = formData.get('userId')?.toString()

    if (!userId) {
      redirect('/admin')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    })

    redirect('/admin')
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl bg-white shadow-xl border border-black/10 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Approval Dashboard</h1>
            <p className="text-sm text-gray-600">Review pending signups and approve new users.</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              Sign out
            </button>
          </form>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-600">
            No pending approval requests right now.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((pendingUser) => {
              const permissions = Array.isArray(pendingUser.academy_roles?.[0]?.permissions)
                ? pendingUser.academy_roles[0].permissions.join(', ')
                : String(pendingUser.academy_roles?.[0]?.permissions ?? 'unknown')

              return (
                <div key={pendingUser.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{pendingUser.email}</p>
                      <p className="text-lg font-semibold text-slate-900">{pendingUser.first_name} {pendingUser.last_name}</p>
                      <p className="text-sm text-slate-600">Requested role: <span className="font-medium text-slate-900">{permissions}</span></p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 border border-slate-200">
                        Pending approval
                      </span>
                      <form action={approveUser} className="mt-2 sm:mt-0">
                        <input type="hidden" name="userId" value={pendingUser.id} />
                        <button
                          type="submit"
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-900"
                        >
                          Approve user
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
