import { PulseBlock } from "@/components/layout/portal-loading-shell";

export default function StudentDashboardLoading() {
  return (
    <>
      <div className="mb-8 space-y-2">
        <PulseBlock className="h-8 w-72 max-w-full" />
        <PulseBlock className="h-4 w-64 max-w-full" />
      </div>

      <div className="mb-8 rounded-2xl border border-white/20 bg-background/75 p-5 shadow-lg shadow-foreground/5">
        <div className="flex flex-wrap items-center gap-3">
          <PulseBlock className="h-6 w-16 rounded-full" />
          <PulseBlock className="h-4 w-40" />
          <PulseBlock className="h-4 w-36" />
        </div>
      </div>

      <section>
        <div className="mb-3 space-y-2">
          <PulseBlock className="h-7 w-40" />
          <PulseBlock className="h-4 w-24" />
        </div>

        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-60 flex-shrink-0 rounded-2xl border border-[#1e5fa8]/30 bg-gradient-to-br from-[#1e5fa8]/5 to-[#f9a825]/5 p-4"
            >
              <PulseBlock className="mb-2 h-3 w-16" />
              <PulseBlock className="mb-2 h-5 w-28" />
              <PulseBlock className="mb-3 h-3 w-24" />
              <PulseBlock className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
