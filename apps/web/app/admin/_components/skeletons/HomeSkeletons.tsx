import { Skeleton } from '@/components/ui/Loading';

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center min-h-[92px]"
        >
          <Skeleton className="w-16 h-3 rounded mb-2 mt-1" />
          <Skeleton className="w-10 h-7 rounded mb-2" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function WeeklyChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <Skeleton className="w-48 h-5 rounded" />
          <Skeleton className="w-24 h-3 rounded" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="h-44 px-2 flex items-end justify-between pt-4">
        {[40, 65, 30, 85, 50, 70, 45].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-full">
            <div className="w-3.5 bg-slate-100 rounded-full h-32 relative overflow-hidden">
              <Skeleton
                className="absolute bottom-0 left-0 w-full rounded-full"
                style={{ height: `${h}%` }}
              />
            </div>
            <Skeleton className="w-3 h-3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="w-28 h-5 rounded px-1" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-h-[100px] flex flex-col items-center justify-center gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-16 h-3 rounded" />
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm min-h-[100px] flex flex-col items-center justify-center gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-16 h-3 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Skeleton className="w-32 h-6 rounded" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="w-10 h-2 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="space-y-1">
            <Skeleton className="w-12 h-2 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
        </div>
      </div>
      <Skeleton className="w-full h-2.5 rounded-full" />
    </div>
  );
}
