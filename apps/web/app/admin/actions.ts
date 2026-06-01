'use server';

import { prisma } from '../../../../packages/database';
import { revalidatePath } from 'next/cache';

/**
 * Generates a secure temporary password.
 * In a real-world scenario, you would email this to the user.
 */
function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + 'X1!';
}

export async function addPlayerAdmin(formData: FormData) {
  const email = formData.get('email')?.toString() || '';
  const firstName = formData.get('firstName')?.toString() || '';
  const lastName = formData.get('lastName')?.toString() || '';
  const mobileNumber = formData.get('mobileNumber')?.toString() || '';
  const role = formData.get('role')?.toString() || 'parent';
  
  const tempPassword = generateTempPassword();
  // TODO: Use supabase.auth.admin.createUser({ email, password: tempPassword, email_confirm: true }) 
  // here using your SUPABASE_SERVICE_ROLE_KEY to register them in auth as well.

  await prisma.user.create({
    data: {
      email,
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      status: 'ACTIVE',
      academy_roles: {
        create: { permissions: [role] }
      }
    }
  });

  revalidatePath('/admin');
}

export async function addCoachAdmin(formData: FormData) {
  const email = formData.get('email')?.toString() || '';
  const firstName = formData.get('firstName')?.toString() || '';
  const lastName = formData.get('lastName')?.toString() || '';
  const mobileNumber = formData.get('mobileNumber')?.toString() || '';

  await prisma.user.create({
    data: {
      email,
      first_name: firstName,
      last_name: lastName,
      mobile_number: mobileNumber,
      status: 'ACTIVE',
      academy_roles: {
        create: { permissions: ['coach'] }
      }
    }
  });

  revalidatePath('/admin');
}