import { PulseBlock } from "@/components/layout/portal-loading-shell";

export default function TeacherClassroomLoading() {
  return (
    <>
      <PulseBlock className="mb-6 h-4 w-48" />

      <div className="mb-8 space-y-3">
        <PulseBlock className="h-8 w-56" />
        <div className="flex flex-wrap items-center gap-2">
          <PulseBlock className="h-5 w-16 rounded-full" />
          <PulseBlock className="h-4 w-28" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/20 bg-background/75 shadow-lg shadow-foreground/5">
        <div className="hidden grid-cols-12 gap-4 border-b px-5 py-3 md:grid">
          <PulseBlock className="col-span-4 h-3" />
          <PulseBlock className="col-span-2 mx-auto h-3 w-16" />
          <PulseBlock className="col-span-2 mx-auto h-3 w-16" />
          <PulseBlock className="col-span-2 mx-auto h-3 w-16" />
          <PulseBlock className="col-span-2 ml-auto h-3 w-14" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center md:gap-4"
            >
              <PulseBlock className="h-5 w-36 md:col-span-4" />
              <PulseBlock className="hidden h-4 w-10 md:col-span-2 md:mx-auto md:block" />
              <PulseBlock className="hidden h-4 w-10 md:col-span-2 md:mx-auto md:block" />
              <PulseBlock className="hidden h-4 w-12 md:col-span-2 md:mx-auto md:block" />
              <PulseBlock className="h-9 w-24 md:col-span-2 md:ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
