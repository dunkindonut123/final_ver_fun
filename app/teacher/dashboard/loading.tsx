import { PulseBlock } from "@/components/layout/portal-loading-shell";

export default function TeacherDashboardLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <PulseBlock className="h-8 w-48" />
          <PulseBlock className="h-4 w-40" />
        </div>
        <PulseBlock className="h-10 w-40" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/20 bg-background/75 p-6 shadow-lg shadow-foreground/5"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="space-y-2">
                <PulseBlock className="h-6 w-36" />
                <PulseBlock className="h-5 w-16 rounded-full" />
              </div>
              <PulseBlock className="h-4 w-8" />
            </div>
            <PulseBlock className="mb-4 h-12 w-full rounded-xl" />
            <PulseBlock className="h-10 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}
