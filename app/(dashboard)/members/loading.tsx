export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 bg-muted/40 rounded w-36" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="h-8 bg-muted/60 rounded w-28 mb-2" />
          <div className="h-4 bg-muted/40 rounded w-36" />
        </div>
        <div className="h-9 bg-muted/40 rounded-lg w-24" />
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="h-11 border-b bg-muted/10 flex items-center px-4 gap-8" style={{ borderColor: "hsl(var(--border))" }}>
          {[50, 130, 110, 100, 80, 100].map((w, i) => (
            <div key={i} className="h-3 bg-muted/40 rounded" style={{ width: w }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-14 border-b flex items-center px-4 gap-8" style={{ borderColor: "hsl(var(--border)/0.4)" }}>
            <div className="h-3 bg-muted/25 rounded w-12" />
            <div className="h-3 bg-muted/30 rounded w-32" />
            <div className="h-3 bg-muted/25 rounded w-28" />
            <div className="h-3 bg-muted/25 rounded w-24" />
            <div className="h-5 bg-muted/30 rounded-full w-16" />
            <div className="h-3 bg-muted/20 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
