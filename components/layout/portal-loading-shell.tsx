import { cn } from "@/lib/utils";

interface PortalLoadingShellProps {
  portalLabel?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

/** Static shell chrome for route `loading.tsx` — mirrors MarketingShell layout without client auth/nav. */
export function PortalLoadingShell({
  portalLabel,
  maxWidth = "max-w-6xl",
  children,
}: PortalLoadingShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-36 -right-20 h-80 w-80 rounded-full bg-[#1e5fa8]/8 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-[#e53935]/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-[#f9a825]/8 blur-3xl" />
      </div>

      <header className="relative z-20 px-4 pt-3">
        <div
          className={cn(
            "mx-auto rounded-2xl border border-white/20 bg-background/60 shadow-lg shadow-foreground/5 backdrop-blur-2xl",
            maxWidth
          )}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-12 w-28 animate-pulse rounded-xl bg-muted lg:h-14 lg:w-32" />
              {portalLabel ? (
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  {portalLabel}
                </span>
              ) : null}
            </div>
            <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto px-4 py-8", maxWidth)}>{children}</main>
    </div>
  );
}

export function PulseBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted", className)} />;
}
