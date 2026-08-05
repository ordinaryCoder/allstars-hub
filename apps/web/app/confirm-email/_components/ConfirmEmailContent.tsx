"use client";

import { AcademyLogo } from "@/components/icons";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { resendConfirmationEmail } from "../_actions/action";
import { signOut } from "@/app/(auth)/_actions/auth";

export default function ConfirmEmailContent({ userEmail }: { userEmail?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailFromParams = searchParams.get("email");
  const email = userEmail || (emailFromParams ? decodeURIComponent(emailFromParams) : null);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    if (!email) {
      setError("No email address found to resend confirmation.");
      return;
    }
    startTransition(async () => {
      const result = await resendConfirmationEmail(email);
      if ('alreadyConfirmed' in result && result.alreadyConfirmed) {
        router.push(`/pending?email=${encodeURIComponent(email)}`);
        return;
      }
      if ('error' in result && result.error) {
        setError(result.error);
        setMessage(null);
      } else {
        setMessage("A new confirmation link has been sent to your email.");
        setError(null);
        setCountdown(60);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl border border-black/10 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            <AcademyLogo className="w-6 h-6 text-gray-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Please Confirm Your Email
        </h1>
        <p className="text-gray-600 mb-6">
          We've sent a confirmation link to{" "}
          <span className="font-semibold text-black">
            {email || "your account"}
          </span>
          . Please check your inbox and click the link to activate your
          account.
        </p>
        <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
          The confirmation link will expire in 1 hour. If it expires, you will
          need to resend the link.
        </p>
        <p className="text-gray-600 mb-8">
          Once your email is confirmed, an administrator will review and approve
          your account.
        </p>
        {message && !error && (
          <div className="p-3 mb-4 text-sm rounded-xl text-center font-medium text-green-700 bg-green-50 border border-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 mb-4 text-sm rounded-xl text-center font-medium text-red-600 bg-red-50 border border-red-200">
            {error}
          </div>
        )}
        <div className="flex flex-col items-center gap-4 mt-8">

          <span className="text-sm font-semibold text-black">
            Didn't receive an email?
          </span>

          <button
            onClick={handleResend}
            disabled={isPending || !email || countdown > 0}
            className="block w-full h-14 bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
          >
            {isPending
              ? "Sending..."
              : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend"}
          </button>

          <form action={signOut} className="w-full">
            <button
              type="submit"
              className="block w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
            >
              Return to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
