import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import ConfirmEmailContent from "./_components/ConfirmEmailContent";

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl border border-black/10 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-4 mx-auto w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-5/6 mx-auto" />
      </div>
    </div>
  );
}

export default async function ConfirmEmailPage() {
  // If the user has a session and their email is already confirmed,
  // there is nothing to do here — send them to the pending approval page.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    redirect(`/pending?email=${encodeURIComponent(user.email ?? "")}`);
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}