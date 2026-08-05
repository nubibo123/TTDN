export default function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
      {/* Page title */}
      <div className="mb-8 space-y-3">
        <div className="skeleton h-9 w-72 rounded-xl" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      {/* Content area — mimics a typical 2-col grid page */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-cream-200 bg-white p-6 space-y-3">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-5/6" />
            <div className="flex items-center justify-between pt-3 border-t border-cream-200">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
