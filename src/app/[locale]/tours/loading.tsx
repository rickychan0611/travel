export default function ToursLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page heading skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[80, 100, 90, 110].map((w) => (
          <div
            key={w}
            className="h-8 rounded-md bg-muted animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Product card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            {/* Image */}
            <div className="aspect-[4/3] bg-muted animate-pulse" />
            {/* Content */}
            <div className="p-3 space-y-2">
              <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            </div>
            {/* Footer */}
            <div className="px-3 pb-3 flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
