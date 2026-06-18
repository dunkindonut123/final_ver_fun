"use client";

import { MarketingShell } from "@/components/layout/marketing-shell";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/classrooms", label: "Classrooms" },
  { href: "/admin/promotions", label: "Promotions" },
];

interface AdminShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AdminShell({ title, description, children }: AdminShellProps) {
  return (
    <MarketingShell portalLabel="Admin Portal" signOutRedirect="/admin/login" navItems={NAV_ITEMS}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </MarketingShell>
  );
}
