import { PulseBlock } from "@/components/layout/portal-loading-shell";

export default function AdminTeachersLoading() {
  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <PulseBlock className="h-8 w-36" />
          <PulseBlock className="h-4 w-56" />
        </div>
        <PulseBlock className="h-10 w-36" />
      </div>

      <div className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="space-y-2">
                <PulseBlock className="h-4 w-36" />
                <PulseBlock className="h-3 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <PulseBlock className="h-5 w-16 rounded-full" />
                <PulseBlock className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
