"use client";

import { MarketingShell } from "@/components/layout/marketing-shell";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/classrooms", label: "Classrooms" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/materials", label: "Materials" },
];

/** Nav chrome only — used by the admin portal layout. */
export function AdminChrome({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell portalLabel="Admin Portal" signOutRedirect="/admin/login" navItems={NAV_ITEMS}>
      {children}
    </MarketingShell>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
}

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
