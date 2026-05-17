import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authContext = await getAuthContext(request);

    if ('error' in authContext) {
      return NextResponse.json({ error: authContext.error }, { status: authContext.status });
    }

    const { db } = authContext;
    
    // RLS blocks data not matching the academy_id in the token
    const attendanceRecords = await db.attendance.findMany();

    return NextResponse.json({ data: attendanceRecords });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}