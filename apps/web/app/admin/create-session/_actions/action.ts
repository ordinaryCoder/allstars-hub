'use server';

import { createClient } from '@/lib/server';
import { prisma } from '@packages/database';
import { requireRole } from '@/lib/dal';
import { revalidatePath } from 'next/cache';

export interface CreateSessionResult {
  success: boolean;
  error?: string;
  sessionId?: string;
}

export async function createSessionAdmin(formData: FormData): Promise<CreateSessionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    await requireRole(user.id, 'admin');

    const locationId = formData.get('locationId')?.toString().trim();
    const coachId = formData.get('coachId')?.toString().trim();
    const dateStr = formData.get('date')?.toString().trim(); // YYYY-MM-DD
    const timeStr = formData.get('time')?.toString().trim(); // HH:mm (e.g. "14:30")

    if (!locationId) {
      return { success: false, error: 'Please select a location.' };
    }
    if (!coachId) {
      return { success: false, error: 'Please select a coach for this session.' };
    }
    if (!dateStr || !timeStr) {
      return { success: false, error: 'Please select both a date and a time.' };
    }

    // Validate location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, academy_id: true, name: true },
    });

    if (!location) {
      return { success: false, error: 'Selected location does not exist.' };
    }

    // Validate coach exists and is active
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: { id: true, status: true, first_name: true, last_name: true },
    });

    if (!coach || coach.status !== 'ACTIVE') {
      return { success: false, error: 'Selected coach is inactive or invalid.' };
    }

    // Validate date & time formats
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      return { success: false, error: 'Invalid date or time format.' };
    }

    // Enforce 30-minute interval rule (minutes must be 0 or 30)
    if (minutes !== 0 && minutes !== 30) {
      return {
        success: false,
        error: 'Session start time must be in 30-minute intervals (e.g., 2:00 PM or 2:30 PM).',
      };
    }

    // Enforce no sessions between 10:00 PM (22:00) and 3:00 AM (03:00)
    const isRestrictedNightHours = hours >= 22 || hours < 3 || (hours === 3 && minutes === 0);
    if (isRestrictedNightHours) {
      return {
        success: false,
        error: 'Sessions cannot be scheduled between 10:00 PM and 3:00 AM.',
      };
    }

    const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 30 * 60 * 1000); // At least 30 minutes in future

    if (startTime.getTime() < minAllowedTime.getTime()) {
      return {
        success: false,
        error: 'Session start time must be at least 30 minutes in the future.',
      };
    }

    // 3 hours session duration window for coach attendance marking
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        academy_id: location.academy_id,
        location_id: location.id,
        coach_id: coach.id,
        created_by: user.id,
        start_time: startTime,
        end_time: endTime,
      },
    });

    revalidatePath('/admin');
    revalidatePath('/admin/sessions/upcoming');
    revalidatePath('/coach');

    return { success: true, sessionId: session.id };
  } catch (err: any) {
    console.error('Error creating session:', err);
    return { success: false, error: err?.message || 'Failed to create session.' };
  }
}
