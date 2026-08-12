"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FunMandarinLogo } from "@/components/layout/fun-mandarin-logo";
import { Loader2, LogOut, Menu, X } from "lucide-react";
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

function NavLink({
  item,
  active,
  onNavigate,
  className,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-[#1e5fa8] text-white shadow-sm"
          : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
        className
      )}
    >
      {item.label}
    </Link>
  );
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
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Multi-link portals (admin) collapse on small screens; single-link stays inline.
  const collapseNavOnMobile = navItems.length > 1;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(signOutRedirect ?? "/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-36 -right-20 h-80 w-80 rounded-full bg-[#1e5fa8]/8 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-64 w-64 rounded-full bg-[#e53935]/8 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-[#f9a825]/8 blur-3xl" />
      </div>

      <header className="relative z-30 pt-[env(safe-area-inset-top)] sm:px-4 sm:pt-3">
        <div
          className={cn(
            "mx-auto border-b border-white/20 bg-background/80 shadow-sm shadow-foreground/5 backdrop-blur-2xl sm:rounded-2xl sm:border sm:bg-background/60 sm:shadow-lg",
            maxWidth
          )}
        >
          <div className="flex items-center justify-between gap-3 py-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 sm:py-2.5">
            <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
              <FunMandarinLogo className="h-12 w-auto lg:h-14" />
              {portalLabel ? (
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  {portalLabel}
                </span>
              ) : null}
            </Link>

            {navItems.length > 0 ? (
              <nav
                className={cn(
                  "flex-1 flex-wrap items-center justify-center gap-1 lg:gap-2",
                  collapseNavOnMobile ? "hidden md:flex" : "flex"
                )}
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={pathname === item.href}
                  />
                ))}
              </nav>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {collapseNavOnMobile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-expanded={menuOpen}
                  aria-controls="portal-mobile-nav"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  className="md:hidden rounded-xl px-2"
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={signingOut}
                className="shrink-0 rounded-xl bg-background/70"
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <LogOut className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">
                  {signingOut ? "Signing out…" : "Sign Out"}
                </span>
                <span className="sr-only sm:hidden">
                  {signingOut ? "Signing out…" : "Sign Out"}
                </span>
              </Button>
            </div>
          </div>

          {collapseNavOnMobile && menuOpen ? (
            <nav
              id="portal-mobile-nav"
              className="border-t border-foreground/10 px-3 py-3 md:hidden"
            >
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      active={pathname === item.href}
                      onNavigate={() => setMenuOpen(false)}
                      className="block w-full text-left"
                    />
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto py-4 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-8",
          maxWidth
        )}
      >
        {children}
      </main>
    </div>
  );
}
