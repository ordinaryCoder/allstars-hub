import { createClient } from '../../lib/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Coach Home</h1>
      <p>User: {user.email}</p>
      
      <form action={signOut}>
        <button type="submit" className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  )
}