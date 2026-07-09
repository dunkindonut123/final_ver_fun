import { PortalLoadingShell, PulseBlock } from "@/components/layout/portal-loading-shell";

export default function TeacherStudentLoading() {
  return (
    <PortalLoadingShell portalLabel="Teacher Portal">
      <PulseBlock className="mb-6 h-4 w-48" />

      <div className="mb-6 rounded-2xl border border-white/20 bg-background/75 p-6 shadow-lg shadow-foreground/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <PulseBlock className="h-8 w-48" />
            <PulseBlock className="h-4 w-56" />
            <div className="flex flex-wrap gap-2">
              <PulseBlock className="h-5 w-16 rounded-full" />
              <PulseBlock className="h-5 w-28 rounded-full" />
            </div>
          </div>
          <PulseBlock className="h-10 w-36" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <PulseBlock className="h-5 w-40" />
              <PulseBlock className="h-5 w-24" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 2 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="space-y-2">
                    <PulseBlock className="h-4 w-32" />
                    <PulseBlock className="h-3 w-24" />
                  </div>
                  <PulseBlock className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PortalLoadingShell>
  );
}
