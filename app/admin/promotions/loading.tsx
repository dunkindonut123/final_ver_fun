import { PortalLoadingShell, PulseBlock } from "@/components/layout/portal-loading-shell";

export default function AdminPromotionsLoading() {
  return (
    <PortalLoadingShell portalLabel="Admin Portal">
      <div className="mb-8 space-y-2">
        <PulseBlock className="h-8 w-40" />
        <PulseBlock className="h-4 w-64 max-w-full" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <PulseBlock key={index} className="h-9 w-24 rounded-xl" />
        ))}
      </div>

      <div className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="space-y-2">
                <PulseBlock className="h-4 w-40" />
                <PulseBlock className="h-3 w-56" />
                <PulseBlock className="h-3 w-32" />
              </div>
              <div className="flex gap-2">
                <PulseBlock className="h-9 w-24" />
                <PulseBlock className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLoadingShell>
  );
}
