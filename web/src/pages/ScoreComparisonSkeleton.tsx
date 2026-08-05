import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function ScoreComparisonSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-busy="true">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-cream-200 bg-white space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="p-6 rounded-2xl border border-cream-200 bg-white space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-cream-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-6 w-1/4" rounded="full" />
            </div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  )
}
