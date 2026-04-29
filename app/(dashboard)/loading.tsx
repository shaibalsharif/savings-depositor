export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-5 bg-muted/40 rounded w-48 mb-8" />

      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-muted/60 rounded w-64 mb-2" />
          <div className="h-4 bg-muted/40 rounded w-40" />
        </div>
        <div className="h-10 bg-muted/40 rounded-lg w-32" />
      </div>

      {/* Stats/Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass p-4 h-28 flex flex-col justify-between">
            <div className="h-3 bg-muted/40 rounded w-24" />
            <div className="h-8 bg-muted/60 rounded w-32 mt-2" />
            <div className="h-3 bg-muted/30 rounded w-20 mt-2" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="glass overflow-hidden mt-6">
        <div className="h-12 border-b border-border/40 bg-muted/10 flex items-center px-4">
          <div className="h-4 bg-muted/40 rounded w-full" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 border-b border-border/20 flex items-center px-4 gap-4">
            <div className="h-4 bg-muted/30 rounded w-1/6" />
            <div className="h-4 bg-muted/30 rounded w-1/4" />
            <div className="h-4 bg-muted/30 rounded w-1/6" />
            <div className="h-4 bg-muted/30 rounded w-1/5" />
            <div className="h-6 bg-muted/20 rounded-full w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
