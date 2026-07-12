export default function TourDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link skeleton */}
      <div className="h-4 w-16 rounded bg-muted animate-pulse mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image skeleton */}
        <div className="aspect-4/3 rounded-xl bg-muted animate-pulse" />

        {/* Details skeleton */}
        <div className="space-y-6">
          {/* Type + title */}
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-7 w-full rounded bg-muted animate-pulse" />
            <div className="h-7 w-4/5 rounded bg-muted animate-pulse" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {[60, 80, 70, 90, 65].map((w) => (
              <div
                key={w}
                className="h-5 rounded-full bg-muted animate-pulse"
                style={{ width: w }}
              />
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            {[100, 95, 88, 70].map((pct, i) => (
              <div
                key={i}
                className="h-3 rounded bg-muted animate-pulse"
                style={{ width: `${pct}%` }}
              />
            ))}
          </div>

          {/* Booking panel skeleton */}
          <div className="rounded-xl border p-4 space-y-4">
            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
