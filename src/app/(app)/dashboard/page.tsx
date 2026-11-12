"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { CalendarCheck, TrendingUp, Users, QrCode, BarChart3, ScanLine, Star, CheckCircle2, Clock, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const SERVICE_LABELS: Record<string, string> = {
  general: "General", morning_service: "Morning", evening_service: "Evening",
  midweek: "Midweek", special: "Special",
};

export default function DashboardPage() {
  const { isStaff, isAdmin, user } = useAuth();

  // ── Staff / Admin queries ──────────────────────────────────────────────────
  const { data: totalSessions = 0 } = useQuery({
    queryKey: ["total-sessions"],
    queryFn: async () => { const { count } = await supabase.from("attendance_sessions").select("*", { count: "exact", head: true }); return count ?? 0; },
  });

  const { data: totalMembers = 0 } = useQuery({
    queryKey: ["total-members"],
    queryFn: async () => { const { count } = await supabase.from("guest_members").select("*", { count: "exact", head: true }); return count ?? 0; },
  });

  const { data: totalCheckIns = 0 } = useQuery({
    queryKey: ["total-checkins"],
    queryFn: async () => { const { count } = await supabase.from("attendance_records").select("*", { count: "exact", head: true }); return count ?? 0; },
  });

  const { data: recentSessions = [] } = useQuery<any[]>({
    queryKey: ["recent-sessions-dashboard"],
    enabled: isStaff || isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("attendance_sessions")
        .select("id, title, created_at, expires_at, service_type, attendance_records(count)")
        .order("created_at", { ascending: false }).limit(5);
      return (data ?? []) as any[];
    },
  });

  // Latest service category breakdown (members / non-members / first-timers)
  const { data: latestBreakdown } = useQuery({
    queryKey: ["latest-breakdown"],
    enabled: isStaff || isAdmin,
    queryFn: async () => {
      const { data: latest } = await supabase.from("attendance_sessions").select("id, title").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!latest) return null;
      const sessionId = (latest as any).id;

      const { data: guestRecords } = await supabase.from("attendance_records").select("guest_member_id, guest_members(member_type)").eq("session_id", sessionId).not("guest_member_id", "is", null);
      const { data: userRecords } = await supabase.from("attendance_records").select("user_id, profiles(member_type)").eq("session_id", sessionId).not("user_id", "is", null);

      let member = 0, non_member = 0, first_timer = 0;
      (guestRecords ?? []).forEach((r: any) => {
        const t = r.guest_members?.member_type;
        if (t === "member") member++; else if (t === "non_member") non_member++; else first_timer++;
      });
      (userRecords ?? []).forEach((r: any) => {
        const t = r.profiles?.member_type;
        if (t === "member") member++; else if (t === "non_member") non_member++; else first_timer++;
      });

      const total = member + non_member + first_timer;

      // Attendance by fellowship for this session
      const { data: guestFellowship } = await supabase.from("attendance_records").select("guest_member_id, guest_members(fellowships(name))").eq("session_id", sessionId).not("guest_member_id", "is", null);
      const { data: userFellowship } = await supabase.from("attendance_records").select("user_id, profiles(fellowships(name))").eq("session_id", sessionId).not("user_id", "is", null);
      const fCounts: Record<string, number> = {};
      const bumpF = (n: string | null | undefined) => { const k = n ?? "Unassigned"; fCounts[k] = (fCounts[k] ?? 0) + 1; };
      (guestFellowship ?? []).forEach((r: any) => bumpF(r.guest_members?.fellowships?.name));
      (userFellowship ?? []).forEach((r: any) => bumpF(r.profiles?.fellowships?.name));
      const byFellowship = Object.entries(fCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

      return { title: (latest as any).title, total, member, non_member, first_timer, byFellowship };
    },
  });

  const { data: recentRecords = [] } = useQuery<any[]>({
    queryKey: ["recent-records-chart"],
    queryFn: async () => {
      const since = subDays(new Date(), 6).toISOString();
      const { data } = await supabase.from("attendance_records").select("scanned_at").gte("scanned_at", since);
      return data ?? [];
    },
  });

  // ── Member personal queries ────────────────────────────────────────────────
  const { data: myRecords = [] } = useQuery<any[]>({
    queryKey: ["my-attendance", user?.id],
    enabled: !!user && !isStaff && !isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("attendance_records")
        .select("scanned_at, session_id, attendance_sessions(title, service_type, created_at)")
        .eq("user_id", user!.id)
        .order("scanned_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: myProfile } = useQuery<any>({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name, member_type").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const days = Array.from({ length: 7 }).map((_, i) => startOfDay(subDays(new Date(), 6 - i)));
  const chartData = days.map(d => ({
    day: format(d, "EEE"),
    count: recentRecords.filter(r => startOfDay(new Date(r.scanned_at)).getTime() === d.getTime()).length,
  }));

  // This month's attendance for the member
  const thisMonth = myRecords.filter(r => new Date(r.scanned_at).getMonth() === new Date().getMonth());
  const thisYear  = myRecords.filter(r => new Date(r.scanned_at).getFullYear() === new Date().getFullYear());

  if (!isStaff && !isAdmin) {
    // ── Regular member personal dashboard ─────────────────────────────────
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="mt-1 text-muted-foreground">Welcome back{myProfile?.name ? `, ${myProfile.name}` : ""}!</p>
        </div>

        {/* Personal stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: CalendarCheck, label: "This month",    value: thisMonth.length },
            { icon: TrendingUp,    label: "This year",     value: thisYear.length  },
            { icon: Star,          label: "All time",      value: myRecords.length },
          ].map(s => (
            <div key={s.label} className="glass rounded-3xl p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
              <div className="mt-4 text-3xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick action */}
        <Link href="/scan" className="flex items-center gap-4 rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><ScanLine className="h-6 w-6" /></div>
          <div><div className="text-lg font-bold">Scan QR code</div><div className="text-sm opacity-80">Mark your attendance for today's session</div></div>
        </Link>

        {/* Attendance history */}
        <div className="glass rounded-3xl">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-display text-lg font-semibold">Attendance history</h2>
          </div>
          {myRecords.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary mb-3"><CalendarCheck className="h-7 w-7" /></div>
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
              <Link href="/scan" className="mt-3 inline-block text-sm text-primary hover:underline">Scan a QR code to get started →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {myRecords.map((r: any, i: number) => {
                const session = r.attendance_sessions;
                return (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{session?.title ?? "Session"}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {session?.service_type && session.service_type !== "general" && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{SERVICE_LABELS[session.service_type]}</span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(r.scanned_at), "MMM d, yyyy · h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Staff / Admin dashboard ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back — here&apos;s your overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: CalendarCheck, label: "Total sessions",    value: totalSessions },
          { icon: Users,         label: "Registered members",value: totalMembers  },
          { icon: TrendingUp,    label: "Total check-ins",   value: totalCheckIns },
        ].map(s => (
          <div key={s.label} className="glass rounded-3xl p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
            <div className="mt-4 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {latestBreakdown && (
        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Latest service — {latestBreakdown.title}</h2>
            <Link href="/analytics" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
              <div className="text-2xl font-bold">{latestBreakdown.total}</div>
              <div className="text-xs text-muted-foreground">Total attendance</div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-1.5 text-2xl font-bold text-primary"><UserCheck className="h-4 w-4" />{latestBreakdown.member}</div>
              <div className="text-xs text-muted-foreground">Members present</div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-2xl font-bold text-muted-foreground"><UserX className="h-4 w-4" />{latestBreakdown.non_member}</div>
              <div className="text-xs text-muted-foreground">Non-members present</div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-1.5 text-2xl font-bold text-blue-600"><Star className="h-4 w-4" />{latestBreakdown.first_timer}</div>
              <div className="text-xs text-muted-foreground">First-timers present</div>
            </div>
          </div>

          {latestBreakdown.byFellowship && latestBreakdown.byFellowship.length > 0 && (
            <div className="mt-5 border-t border-border/60 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance by fellowship</p>
              <div className="flex flex-wrap gap-2">
                {latestBreakdown.byFellowship.map(f => (
                  <div key={f.name} className="flex items-center gap-1.5 rounded-full bg-card/60 border border-border px-3 py-1.5 text-xs">
                    <span className="font-medium">{f.name}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Check-ins · last 7 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 15% 88%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="count" name="Check-ins" fill="hsl(270 60% 35%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <Link href="/admin" className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/30">
              <QrCode className="h-5 w-5" />
              <div><div className="font-semibold">Create session</div><div className="text-xs opacity-80">Generate a new QR code</div></div>
            </Link>
            <Link href="/members" className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
              <Users className="h-5 w-5 text-primary" />
              <div><div className="font-semibold">View members</div><div className="text-xs text-muted-foreground">See who attended</div></div>
            </Link>
            <Link href="/analytics" className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div><div className="font-semibold">Analytics</div><div className="text-xs text-muted-foreground">Trends and growth</div></div>
            </Link>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent sessions</h2>
          <Link href="/admin" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No sessions yet. <Link href="/admin" className="text-primary hover:underline">Create one</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="pb-3">Session</th><th className="pb-3">Type</th><th className="pb-3">Date</th><th className="pb-3">Attended</th><th className="pb-3">Status</th></tr>
              </thead>
              <tbody>
                {recentSessions.map((s: any) => {
                  const expired = new Date(s.expires_at) < new Date();
                  return (
                    <tr key={s.id} className="border-t border-border/60">
                      <td className="py-3 font-medium">{s.title}</td>
                      <td className="py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{SERVICE_LABELS[s.service_type] ?? "General"}</span></td>
                      <td className="py-3 text-muted-foreground">{format(new Date(s.created_at), "MMM d, yyyy")}</td>
                      <td className="py-3"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{s.attendance_records?.[0]?.count ?? 0}</span></td>
                      <td className="py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${expired ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{expired ? "Ended" : "Live"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
