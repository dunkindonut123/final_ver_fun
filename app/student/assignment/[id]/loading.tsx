import { PortalLoadingShell, PulseBlock } from "@/components/layout/portal-loading-shell";

export default function StudentAssignmentLoading() {
  return (
    <PortalLoadingShell portalLabel="Student Portal">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <PulseBlock className="h-8 w-48" />
        <div className="w-full max-w-xl space-y-4 rounded-2xl border border-white/20 bg-background/75 p-8 shadow-lg shadow-foreground/5">
          <PulseBlock className="mx-auto h-16 w-16 rounded-full" />
          <PulseBlock className="mx-auto h-6 w-56 max-w-full" />
          <PulseBlock className="h-4 w-full" />
          <PulseBlock className="h-12 w-full" />
          <PulseBlock className="mx-auto h-10 w-36" />
        </div>
      </div>
    </PortalLoadingShell>
  );
}
