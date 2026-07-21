"use server";

import { createClient } from "../../lib/server";

export async function resendConfirmationEmail(email: string) {
  if (!email) {
    return { error: "Email is required to resend confirmation." };
  }
  
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}