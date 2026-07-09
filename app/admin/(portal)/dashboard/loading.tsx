import { PulseBlock } from "@/components/layout/portal-loading-shell";

export default function AdminDashboardLoading() {
  return (
    <>
      <div className="mb-8 space-y-2">
        <PulseBlock className="h-8 w-48" />
        <PulseBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5"
          >
            <div className="border-b px-5 py-4">
              <PulseBlock className="h-5 w-48" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="space-y-2">
                    <PulseBlock className="h-4 w-32" />
                    <PulseBlock className="h-3 w-40" />
                  </div>
                  <div className="flex gap-2">
                    <PulseBlock className="h-9 w-20" />
                    <PulseBlock className="h-9 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
