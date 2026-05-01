export default function DepositsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 bg-muted/40 rounded w-40" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="h-8 bg-muted/60 rounded w-36 mb-2" />
          <div className="h-4 bg-muted/40 rounded w-52" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 bg-muted/40 rounded-lg w-24" />
          <div className="h-9 bg-muted/50 rounded-lg w-36" />
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", width: "fit-content" }}>
        {[120, 110, 110].map((w, i) => (
          <div key={i} className="h-8 rounded-lg bg-muted/60" style={{ width: w }} />
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="h-9 bg-muted/40 rounded-md w-36" />
        <div className="h-9 bg-muted/40 rounded-md w-32" />
        <div className="h-9 bg-muted/40 rounded-md w-28" />
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="h-11 border-b bg-muted/10 flex items-center px-4 gap-8" style={{ borderColor: "hsl(var(--border))" }}>
          {[80, 120, 80, 90, 100, 80, 60].map((w, i) => (
            <div key={i} className="h-3 bg-muted/40 rounded" style={{ width: w }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-14 border-b flex items-center px-4 gap-8" style={{ borderColor: "hsl(var(--border)/0.4)" }}>
            <div className="h-3 bg-muted/30 rounded w-20" />
            <div className="h-3 bg-muted/30 rounded w-28" />
            <div className="h-4 bg-muted/40 rounded w-16" />
            <div className="h-3 bg-muted/30 rounded w-20" />
            <div className="h-5 bg-muted/20 rounded-full w-16" />
            <div className="h-3 bg-muted/20 rounded w-24" />
            <div className="h-5 bg-muted/30 rounded-full w-12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
