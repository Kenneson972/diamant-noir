export default function ProprioDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-navy/10" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-lg bg-navy/5" />
        <div className="h-24 rounded-lg bg-navy/5" />
        <div className="h-24 rounded-lg bg-navy/5" />
      </div>
      <div className="h-64 rounded-lg bg-navy/5" />
    </div>
  );
}
