'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/server'
import { prisma } from '../../../../../packages/database'

export async function signup(formData: FormData): Promise<void> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const firstName = formData.get('firstName')?.toString().trim() ?? ''
  const lastName = formData.get('lastName')?.toString().trim() ?? ''
  const mobileNumber = formData.get('mobileNumber')?.toString().trim() ?? ''
  const role = formData.get('role')?.toString() ?? 'parent'
  const guardianName = formData.get('guardianName')?.toString().trim() ?? ''

  if (!email || !password || !firstName || !lastName || !mobileNumber || (role === 'parent' && !guardianName)) {
    return redirect('/signup?error=Please fill in all required fields')
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  })

  if (!academy) {
    return redirect('/signup?error=No active academy available')
  }

  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError || !authData?.user) {
    return redirect(`/signup?error=${encodeURIComponent(authError?.message ?? 'Unable to create account')}`)
  }

  try {
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        status: 'PENDING',
        academy_roles: {
          create: {
            academy_id: academy.id,
            permissions: [role],
          },
        },
      },
    })
    console.log("Signup request saved for user:", email)
  } catch (error) {
    console.error('Signup DB error:', error)
    return redirect('/signup?error=Unable to save signup request')
  }

  redirect(`/pending?email=${encodeURIComponent(email)}`)
}
