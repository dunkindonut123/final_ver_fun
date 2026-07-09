import { PortalLoadingShell, PulseBlock } from "@/components/layout/portal-loading-shell";

export default function AdminMaterialsLoading() {
  return (
    <PortalLoadingShell portalLabel="Admin Portal">
      <div className="mb-8 space-y-2">
        <PulseBlock className="h-8 w-40" />
        <PulseBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <PulseBlock className="h-4 w-4" />
                <PulseBlock className="h-5 w-24" />
              </div>
              <PulseBlock className="h-4 w-16" />
            </div>
            {index === 0 ? (
              <div className="divide-y border-t">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="space-y-2">
                      <PulseBlock className="h-4 w-36" />
                      <PulseBlock className="h-3 w-48" />
                    </div>
                    <div className="flex gap-2">
                      <PulseBlock className="h-9 w-24" />
                      <PulseBlock className="h-9 w-9" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </PortalLoadingShell>
  );
}
