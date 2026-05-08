import { NextResponse } from 'next/server';
import { getTenantDb } from '@packages/database';
import { verifySupabaseToken } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // VERIFY FIRST! Stop fake tokens here.
    await verifySupabaseToken(token);

    // Initialize secure Prisma client
    const db = getTenantDb(token);
    
    // RLS blocks data not matching the academy_id in the token
    const attendanceRecords = await db.attendance.findMany();

    return NextResponse.json({ data: attendanceRecords });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}