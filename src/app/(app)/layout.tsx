"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, QrCode, ScanLine, LogOut, Crown, Users, BarChart3, ClipboardList, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, isStaff, isAdmin, isFellowshipLeader } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/scan",      label: "Scan QR",   icon: ScanLine,        show: true },
    { href: "/admin",     label: "Sessions",  icon: QrCode,          show: isStaff || isAdmin },
    { href: "/members",   label: "Members",   icon: Users,           show: isStaff || isAdmin || isFellowshipLeader },
    { href: "/attendance",label: "Attendance", icon: ClipboardList,  show: isStaff || isAdmin || isFellowshipLeader },
    { href: "/evolve-admin", label: "Evolve", icon: Ticket, show: isStaff || isAdmin },
    { href: "/analytics", label: "Analytics", icon: BarChart3,       show: isStaff || isAdmin },
  ].filter(n => n.show);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-screen w-64 flex-col p-5 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
            <Crown className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold">TCC</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-border bg-card/60 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{user.email}</div>
              <div className="text-[10px] text-muted-foreground">{isAdmin ? "Admin" : isStaff ? "Staff" : isFellowshipLeader ? "Fellowship Leader" : "Member"}</div>
            </div>
            <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="glass fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Crown className="h-3 w-3" />
          </div>
          <span className="font-display font-bold">TCC</span>
        </Link>
        <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground"><LogOut className="h-4 w-4" /></button>
      </div>

      <main className="flex-1 px-4 pt-20 pb-24 md:p-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl py-2 md:hidden">
        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <n.icon className="h-5 w-5" />{n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
