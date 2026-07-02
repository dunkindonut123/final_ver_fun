import { MarketingShell } from "@/components/layout/marketing-shell";

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell
      portalLabel="Teacher Portal"
      signOutRedirect="/login"
      navItems={[{ href: "/teacher/dashboard", label: "Dashboard" }]}
    >
      {children}
    </MarketingShell>
  );
}
