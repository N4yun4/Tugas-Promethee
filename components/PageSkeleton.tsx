export function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Memuat data">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted-bg" />
      <div className="h-4 w-80 animate-pulse rounded bg-muted-bg" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}
