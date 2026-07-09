import { PulseBlock } from "@/components/layout/portal-loading-shell";

export default function StudentChapterLoading() {
  return (
    <>
      <PulseBlock className="mb-6 h-9 w-40" />

      <div className="mb-8 space-y-3">
        <PulseBlock className="h-6 w-16 rounded-full" />
        <PulseBlock className="h-9 w-72 max-w-full" />
        <PulseBlock className="h-4 w-80 max-w-full" />
      </div>

      <div className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <div className="grid grid-cols-2 gap-3 border-b border-border/60 p-4 sm:gap-4 sm:p-5">
          <PulseBlock className="min-h-[5.5rem] rounded-2xl sm:min-h-[6rem]" />
          <PulseBlock className="min-h-[5.5rem] rounded-2xl sm:min-h-[6rem]" />
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/20 bg-background/75 p-5 shadow-lg shadow-foreground/5"
            >
              <div className="space-y-2">
                <PulseBlock className="h-3 w-24" />
                <PulseBlock className="h-5 w-40" />
              </div>
              <PulseBlock className="h-10 w-28" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
