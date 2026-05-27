import Link from 'next/link';

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-xl border border-black/10 rounded-2xl p-6 sm:p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          The account <span className="font-semibold text-black">{email || 'you are using'}</span> does not have permission to access this page.
        </p>
        <Link 
          href="/login"
          className="w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-sm"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
