'use server';

import { createClient } from '../../lib/server';
import { prisma } from '../../../../packages/database';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      first_name: formData.get('firstName') as string,
      last_name: formData.get('lastName') as string,
      mobile_number: formData.get('mobileNumber') as string,
    }
  });

  revalidatePath('/player/profile');
  revalidatePath('/player');
}