import { PortalLoadingShell, PulseBlock } from "@/components/layout/portal-loading-shell";

export default function AdminQuestionsLoading() {
  return (
    <PortalLoadingShell portalLabel="Admin Portal">
      <div className="mb-8 space-y-2">
        <PulseBlock className="h-8 w-36" />
        <PulseBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/20 bg-background/75 p-6 shadow-lg shadow-foreground/5">
          <PulseBlock className="mb-4 h-5 w-32" />
          <div className="space-y-4">
            <PulseBlock className="h-10 w-full" />
            <PulseBlock className="h-10 w-full" />
            <PulseBlock className="h-24 w-full" />
            <PulseBlock className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/20 bg-background/75 p-6 shadow-lg shadow-foreground/5">
          <PulseBlock className="mb-4 h-5 w-28" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <PulseBlock key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </PortalLoadingShell>
  );
}
