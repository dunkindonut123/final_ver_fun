import { MarketingShell } from "@/components/layout/marketing-shell";

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell
      portalLabel="Student Portal"
      signOutRedirect="/login"
      navItems={[{ href: "/student/dashboard", label: "Dashboard" }]}
    >
      {children}
    </MarketingShell>
  );
}
