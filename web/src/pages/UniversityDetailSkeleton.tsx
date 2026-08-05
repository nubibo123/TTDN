import { Skeleton } from '@/components/ui/Skeleton'

export default function UniversityDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-busy="true">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="mb-8 rounded-2xl border border-cream-200 overflow-hidden bg-white">
        <div className="bg-navy-800/90 px-8 py-8 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-cream-200">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton rounded="lg" className="w-10 h-10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-8 py-4 space-y-3">
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-cream-200 overflow-hidden">
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>

      <div className="p-6 rounded-2xl border border-cream-200 bg-white space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-cream-200 px-4 py-3">
            <Skeleton className="h-5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
