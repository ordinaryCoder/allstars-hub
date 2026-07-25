import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { prisma } from '../../../../packages/database'
import { signOut } from '../actions'

export default async function PendingApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No session → nothing to wait for, go to login
  if (!user) {
    redirect('/login')
  }

  // If the admin has already approved this user, send them to login
  // so they pick up a fresh JWT with their roles.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true },
  })

  if (dbUser?.status === 'ACTIVE') {
    redirect('/login')
  }

  const params = await searchParams
  const email = params.email || user.email || 'your account'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl border border-black/10 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Approval Pending</h1>
        <p className="text-gray-600 mb-6">
          The account <span className="font-semibold text-black">{email}</span> is under review.
        </p>
        <p className="text-gray-600 mb-6">
          An administrator will approve your access shortly. If you need help, please contact support.
        </p>
        <div className="space-y-3">
          <form action={signOut}>
            <button
              type="submit"
              className="block w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
            >
              Return to Login
            </button>
          </form>
          <a
            href="mailto:support@example.com"
            className="block text-sm text-gray-700 hover:text-gray-900"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
