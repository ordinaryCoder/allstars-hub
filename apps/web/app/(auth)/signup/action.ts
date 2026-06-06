'use server'

import { createClient } from '../../../lib/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { prisma } from '../../../../../packages/database'

export async function signup(formData: FormData, isFromAdmin = false) {
  const email = formData.get('email')?.toString().trim() ?? ''
  let password = formData.get('password')?.toString() ?? ''
  const firstName = formData.get('firstName')?.toString().trim() ?? ''
  const lastName = formData.get('lastName')?.toString().trim() ?? ''
  const mobileNumber = formData.get('mobileNumber')?.toString().trim() ?? ''
  const role = formData.get('role')?.toString() ?? 'parent'
  const guardianName = formData.get('guardianName')?.toString().trim() ?? ''
  const dob = formData.get('dob')?.toString() ?? ''

  if (isFromAdmin && !password) {
    password = Math.random().toString(36).slice(-8) + 'X1!'
  }

  if (!email || !password || !firstName || !lastName || !mobileNumber || (role === 'parent' && !guardianName) || !dob) {
    return { error: 'Please fill in all required fields' }
  }

  const academy = await prisma.academy.findFirst({
    where: { is_active: true },
    select: { id: true },
  })

  if (!academy) {
    return { error: 'No active academy available' }
  }

  let authData;
  let authError;

  if (isFromAdmin) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await supabaseAdmin.auth.signUp({ email, password });
    authData = data;
    authError = error;
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    authData = data;
    authError = error;
  }

  if (authError || !authData?.user) {
    return { error: authError?.message ?? 'Unable to create account' }
  }

  try {
    if (role === 'parent') {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          first_name: guardianName,
          last_name: lastName, // last_name is required in the Prisma schema, so we pass an empty string
          mobile_number: mobileNumber,
          status: isFromAdmin ? 'ACTIVE' : 'PENDING',
          academy_roles: {
            create: { academy_id: academy.id, permissions: ['parent'] },
          },
          parent_of: {
            create: {
              player: {
                create: {
                  academy_id: academy.id,
                  first_name: firstName,
                  last_name: lastName,
                  dob: new Date(dob),
                }
              }
            }
          }
        },
      });
    } else {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          status: isFromAdmin ? 'ACTIVE' : 'PENDING',
          academy_roles: {
            create: { academy_id: academy.id, permissions: ['player'] },
          },
        },
      });

      await prisma.player.create({
        data: {
          academy_id: academy.id,
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          dob: new Date(dob),
        }
      });
    }
    console.log("Signup request saved for user:", email)
  } catch (error) {
    console.error('Signup DB error:', error)
    return { error: 'Unable to save signup request' }
  }

  if (!isFromAdmin) {
    return { success: true, email }
  }
}
