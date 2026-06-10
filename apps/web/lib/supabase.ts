// import { createClient } from '@supabase/supabase-js';
// import { getTenantDb } from '@packages/database';

// // Use Anon key to verify JWT signature securely
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// export const supabase = createClient(supabaseUrl, supabaseKey);

// export async function verifySupabaseToken(token: string) {
//   // Supabase checks signature and expiration
//   const { data, error } = await supabase.auth.getUser(token);
  
//   if (error || !data.user) {
//     throw new Error('Invalid or expired token');
//   }
  
//   return data.user;
// }

// export async function getAuthContext(request: Request) {
//   const authHeader = request.headers.get('Authorization');
  
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return { error: 'Missing token', status: 401 };
//   }

//   const token = authHeader.split(' ')[1];
  
//   try {
//     // Use the stateless global client to verify the token securely
//     const user = await verifySupabaseToken(token);
//     const db = getTenantDb(token);
    
//     return { user, db, token };
//   } catch (error) {
//     return { error: 'Invalid token', status: 401 };
//   }
// }