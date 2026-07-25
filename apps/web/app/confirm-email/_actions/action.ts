"use server";

import { createClient } from "@/lib/server";

export async function resendConfirmationEmail(email: string) {
  if (!email) {
    return { error: "Email is required to resend confirmation." };
  }

  const supabase = await createClient();

  // If there is an active session with a confirmed email, don't resend
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email_confirmed_at) {
    return { alreadyConfirmed: true as const };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    // Supabase returns specific messages when the email is already verified
    if (
      msg.includes("already confirmed") ||
      msg.includes("already registered")
    ) {
      return { alreadyConfirmed: true as const };
    }
    return { error: error.message };
  }

  return { success: true };
}