import { PortalLoadingShell, PulseBlock } from "@/components/layout/portal-loading-shell";

export default function AdminClassroomsLoading() {
  return (
    <PortalLoadingShell portalLabel="Admin Portal">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <PulseBlock className="h-8 w-40" />
          <PulseBlock className="h-4 w-64 max-w-full" />
        </div>
        <PulseBlock className="h-10 w-40" />
      </div>

      <PulseBlock className="mb-6 h-10 w-full max-w-md" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <PulseBlock className="h-4 w-4" />
                <div className="space-y-2">
                  <PulseBlock className="h-5 w-44" />
                  <PulseBlock className="h-3 w-56" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PulseBlock className="h-5 w-16 rounded-full" />
                <PulseBlock className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalLoadingShell>
  );
}
