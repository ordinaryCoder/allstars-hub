import { NextResponse } from 'next/server';
// Ensure this matches the name in /packages/database/package.json
import { getTenantDb } from 'database'; 

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
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