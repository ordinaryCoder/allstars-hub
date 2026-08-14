import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
      <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856a9.375 9.375 0 0 1 13.788 0M1.924 8.674a13.5 13.5 0 0 1 20.152 0M12 18.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">You are currently offline</h1>
      <p className="text-slate-400 max-w-md mb-6">
        Please check your internet connection. Some features of AllStars Hub may remain available offline.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors"
      >
        Try Reloading
      </Link>
    </div>
  );
}
