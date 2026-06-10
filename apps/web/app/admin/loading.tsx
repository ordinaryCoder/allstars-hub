export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl bg-white shadow-xl border border-black/10 rounded-3xl p-6 sm:p-8 animate-pulse">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-4 w-96 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="h-4 w-40 bg-slate-200 rounded mb-2"></div>
                  <div className="h-6 w-48 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="h-6 w-32 bg-slate-200 rounded-full border border-slate-200"></div>
                  <div className="mt-2 sm:mt-0 h-11 w-32 bg-slate-200 rounded-2xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
