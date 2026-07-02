"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FunMandarinLogo } from "@/components/layout/fun-mandarin-logo";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

interface MarketingShellProps {
  navItems?: NavItem[];
  signOutRedirect?: string;
  portalLabel?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export function MarketingShell({
  navItems = [],
  signOutRedirect,
  portalLabel,
  maxWidth = "max-w-6xl",
  children,
}: MarketingShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(signOutRedirect ?? "/login");
    router.refresh();
  };

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
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <FunMandarinLogo className="h-12 w-auto lg:h-14" />
              {portalLabel ? (
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  {portalLabel}
                </span>
              ) : null}
            </Link>

            {navItems.length > 0 ? (
              <nav className="flex flex-1 flex-wrap items-center justify-center gap-1 lg:gap-2">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-[#1e5fa8] text-white shadow-sm"
                          : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="flex-1" />
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="shrink-0 rounded-xl bg-background/70"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className={cn("relative z-10 mx-auto px-4 py-8", maxWidth)}>{children}</main>
    </div>
  );
}
