"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, Users, CalendarCheck, Award, Star, UserCheck, RefreshCcw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

type AnalyticsSession = { id: string; title: string; created_at: string; expires_at: string; service_type: string; attendance_records: { count: number }[] };

const SERVICE_LABELS: Record<string, string> = {
  general: "General", morning_service: "Morning", evening_service: "Evening",
  midweek: "Midweek", special: "Special",
};
const SERVICE_COLORS = ["hsl(270 60% 35%)","hsl(200 70% 45%)","hsl(40 80% 55%)","hsl(150 60% 40%)","hsl(320 60% 45%)"];

export default function AnalyticsPage() {
  const { isStaff, isAdmin, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !isStaff && !isAdmin) router.push("/dashboard"); }, [loading, isStaff, isAdmin, router]);

  const { data: sessions = [] } = useQuery<AnalyticsSession[]>({
    queryKey: ["analytics-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("attendance_sessions").select("id, title, created_at, expires_at, service_type, attendance_records(count)").order("created_at", { ascending: true });
      return (data ?? []) as unknown as AnalyticsSession[];
    },
  });

  const { data: records = [] } = useQuery<{ scanned_at: string }[]>({
    queryKey: ["analytics-records"],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase.from("attendance_records").select("scanned_at").gte("scanned_at", since).order("scanned_at");
      return (data as { scanned_at: string }[] | null) ?? [];
    },
  });

  const { data: members = [] } = useQuery<{ created_at: string; member_type: string }[]>({
    queryKey: ["analytics-members"],
    queryFn: async () => {
      const { data } = await supabase.from("guest_members").select("created_at, member_type").order("created_at");
      return (data as any[] | null) ?? [];
    },
  });

  // Per-session breakdown: members / non-members / first-timers present
  const { data: sessionBreakdowns = {} } = useQuery<Record<string, { member: number; non_member: number; first_timer: number; total: number }>>({
    queryKey: ["analytics-session-breakdown"],
    queryFn: async () => {
      const { data: guestRecords } = await supabase
        .from("attendance_records")
        .select("session_id, guest_member_id, guest_members(member_type)")
        .not("guest_member_id", "is", null);

      const { data: userRecords } = await supabase
        .from("attendance_records")
        .select("session_id, user_id, profiles(member_type)")
        .not("user_id", "is", null);

      const acc: Record<string, { member: number; non_member: number; first_timer: number; total: number }> = {};
      const bump = (sessionId: string, type: string | null | undefined) => {
        if (!acc[sessionId]) acc[sessionId] = { member: 0, non_member: 0, first_timer: 0, total: 0 };
        acc[sessionId].total += 1;
        if (type === "member") acc[sessionId].member += 1;
        else if (type === "non_member") acc[sessionId].non_member += 1;
        else acc[sessionId].first_timer += 1; // default / first_timer
      };

      (guestRecords ?? []).forEach((r: any) => bump(r.session_id, r.guest_members?.member_type));
      (userRecords ?? []).forEach((r: any) => bump(r.session_id, r.profiles?.member_type));

      return acc;
    },
  });

  // Attendance per fellowship (all-time check-ins)
  const { data: fellowshipBreakdown = [] } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["analytics-fellowship-breakdown"],
    queryFn: async () => {
      const { data: guestRecords } = await supabase
        .from("attendance_records")
        .select("guest_member_id, guest_members(fellowships(name))")
        .not("guest_member_id", "is", null);
      const { data: userRecords } = await supabase
        .from("attendance_records")
        .select("user_id, profiles(fellowships(name))")
        .not("user_id", "is", null);

      const counts: Record<string, number> = {};
      const bump = (name: string | null | undefined) => {
        const key = name ?? "Unassigned";
        counts[key] = (counts[key] ?? 0) + 1;
      };
      (guestRecords ?? []).forEach((r: any) => bump(r.guest_members?.fellowships?.name));
      (userRecords ?? []).forEach((r: any) => bump(r.profiles?.fellowships?.name));

      return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    },
  });

  // Retention: first timers who came back at least once more
  const { data: retentionData } = useQuery({
    queryKey: ["retention"],
    queryFn: async () => {
      const { data: allRecords } = await supabase.from("attendance_records").select("guest_member_id, session_id").not("guest_member_id", "is", null);
      const records = allRecords ?? [];
      const countMap: Record<string, number> = {};
      records.forEach((r: any) => { countMap[r.guest_member_id] = (countMap[r.guest_member_id] ?? 0) + 1; });
      const total = Object.keys(countMap).length;
      const returned = Object.values(countMap).filter(c => c >= 2).length;
      const retained3 = Object.values(countMap).filter(c => c >= 3).length;
      return { total, returned, retained3, rate: total > 0 ? Math.round((returned / total) * 100) : 0, rate3: total > 0 ? Math.round((retained3 / total) * 100) : 0 };
    },
  });

  const days30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  const dailyData = days30.map(d => {
    const dayStart = startOfDay(d).getTime();
    const dayEnd = dayStart + 86400000;
    return {
      day: format(d, "MMM d"),
      checkins: records.filter(r => { const t = new Date(r.scanned_at).getTime(); return t >= dayStart && t < dayEnd; }).length,
      newMembers: members.filter(m => { const t = new Date(m.created_at).getTime(); return t >= dayStart && t < dayEnd; }).length,
    };
  });

  const sessionData = sessions.slice(-10).map(s => ({
    name: s.title.length > 14 ? s.title.slice(0, 14) + "…" : s.title,
    attended: s.attendance_records?.[0]?.count ?? 0,
  }));

  // Member type pie
  const memberTypeCounts = [
    { name: "First Timer", value: members.filter(m => m.member_type === "first_timer").length, color: "hsl(210 80% 55%)" },
    { name: "Member",      value: members.filter(m => m.member_type === "member").length,      color: "hsl(270 60% 35%)" },
    { name: "Non Member",  value: members.filter(m => m.member_type === "non_member").length,  color: "hsl(270 10% 70%)" },
  ].filter(d => d.value > 0);

  // Service type breakdown
  const serviceBreakdown = Object.entries(
    sessions.reduce((acc: Record<string, number>, s) => {
      const key = s.service_type ?? "general";
      acc[key] = (acc[key] ?? 0) + (s.attendance_records?.[0]?.count ?? 0);
      return acc;
    }, {})
  ).map(([type, count], i) => ({ name: SERVICE_LABELS[type] ?? type, count, color: SERVICE_COLORS[i % SERVICE_COLORS.length] }));

  const totalAttendance = sessions.reduce((sum, s) => sum + (s.attendance_records?.[0]?.count ?? 0), 0);
  const avgAttendance = sessions.length > 0 ? Math.round(totalAttendance / sessions.length) : 0;
  const bestSession = [...sessions].sort((a, b) => (b.attendance_records?.[0]?.count ?? 0) - (a.attendance_records?.[0]?.count ?? 0))[0];
  const bestCount = bestSession?.attendance_records?.[0]?.count ?? 0;

  const latestSession = sessions[sessions.length - 1];
  const latestBreakdown = latestSession ? sessionBreakdowns[latestSession.id] : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div><h1 className="text-3xl font-bold">Analytics</h1><p className="mt-1 text-muted-foreground">Attendance trends, growth and retention.</p></div>

      {/* Top stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarCheck, label: "Total sessions",  value: sessions.length },
          { icon: Users,         label: "Total check-ins", value: totalAttendance },
          { icon: TrendingUp,    label: "Avg per session", value: avgAttendance },
          { icon: Award,         label: "Best turnout",    value: bestCount, sub: bestSession?.title },
        ].map(s => (
          <div key={s.label} className="glass rounded-3xl p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
            <div className="mt-4 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
            {s.sub && <div className="mt-0.5 truncate text-xs text-primary/70">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Latest service breakdown */}
      {latestSession && latestBreakdown && (
        <div className="glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">{latestSession.title}</h2>
              <p className="text-xs text-muted-foreground">{format(new Date(latestSession.created_at), "MMM d, yyyy")} · {SERVICE_LABELS[latestSession.service_type] ?? "General"}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Latest service</span>
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
              <div className="text-2xl font-bold text-muted-foreground">{latestBreakdown.non_member}</div>
              <div className="text-xs text-muted-foreground">Non-members present</div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-1.5 text-2xl font-bold text-blue-600"><Star className="h-4 w-4" />{latestBreakdown.first_timer}</div>
              <div className="text-xs text-muted-foreground">First-timers present</div>
            </div>
          </div>
        </div>
      )}

      {retentionData && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3"><RefreshCcw className="h-5 w-5 text-primary" /><span className="font-semibold">Return rate</span></div>
            <div className="text-4xl font-bold text-primary">{retentionData.rate}%</div>
            <p className="mt-1 text-xs text-muted-foreground">{retentionData.returned} of {retentionData.total} visitors came back at least once</p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${retentionData.rate}%` }} />
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3"><Star className="h-5 w-5 text-blue-500" /><span className="font-semibold">First timer conversion</span></div>
            <div className="text-4xl font-bold text-blue-600">{retentionData.rate3}%</div>
            <p className="mt-1 text-xs text-muted-foreground">{retentionData.retained3} visitors attended 3+ sessions (auto-promoted)</p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${retentionData.rate3}%` }} />
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3"><UserCheck className="h-5 w-5 text-primary" /><span className="font-semibold">Member breakdown</span></div>
            {memberTypeCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={memberTypeCounts} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" nameKey="name">
                    {memberTypeCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="py-8 text-center text-xs text-muted-foreground">No members yet</div>}
          </div>
        </div>
      )}

      {/* Daily check-ins area chart */}
      <div className="glass rounded-3xl p-6">
        <h2 className="mb-1 font-display text-lg font-semibold">Daily check-ins · last 30 days</h2>
        <p className="mb-5 text-xs text-muted-foreground">Check-ins and new registrations per day</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(270 60% 35%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(270 60% 35%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(40 80% 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(40 80% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 15% 88%)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="checkins"   name="Check-ins"        stroke="hsl(270 60% 35%)" fill="url(#ag1)" strokeWidth={2} />
            <Area type="monotone" dataKey="newMembers" name="New registrations" stroke="hsl(40 80% 55%)"  fill="url(#ag2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Session attendance + service type */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Attendance per session</h2>
          <p className="mb-5 text-xs text-muted-foreground">Last 10 sessions</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sessionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 15% 88%)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="attended" name="Attended" fill="hsl(270 60% 35%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="mb-1 font-display text-lg font-semibold">Attendance by service type</h2>
          <p className="mb-5 text-xs text-muted-foreground">Total check-ins across all sessions per type</p>
          {serviceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 15% 88%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="count" name="Attendees" radius={[8, 8, 0, 0]}>
                  {serviceBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="py-16 text-center text-sm text-muted-foreground">No sessions yet</div>}
        </div>
      </div>

      {/* Attendance per fellowship */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Attendance per fellowship</h2>
          {fellowshipBreakdown[0] && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary flex items-center gap-1.5"><Award className="h-3 w-3" /> Top: {fellowshipBreakdown[0].name}</span>
          )}
        </div>
        <p className="mb-5 text-xs text-muted-foreground">Total check-ins across all sessions, grouped by fellowship</p>
        {fellowshipBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(240, fellowshipBreakdown.length * 36)}>
            <BarChart data={fellowshipBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 15% 88%)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="count" name="Check-ins" radius={[0, 8, 8, 0]}>
                {fellowshipBreakdown.map((_, i) => <Cell key={i} fill={i === 0 ? "hsl(40 80% 55%)" : "hsl(270 60% 35%)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="py-16 text-center text-sm text-muted-foreground">No fellowship data yet</div>}
      </div>

      {/* Attendance Recording table */}
      <div className="glass rounded-3xl">
        <div className="border-b border-border/60 px-6 py-4"><h2 className="font-display text-lg font-semibold">Attendance Recording</h2><p className="text-xs text-muted-foreground mt-0.5">Per-service breakdown by category</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                {["Date","Session","Service type","Total attendance","Members","Non-members","First-timers","Status"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...sessions].reverse().map((s) => {
                const bd = sessionBreakdowns[s.id] ?? { member: 0, non_member: 0, first_timer: 0, total: 0 };
                const expired = new Date(s.expires_at) < new Date();
                return (
                  <tr key={s.id} className="border-b border-border/30 last:border-0 hover:bg-card/30">
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(s.created_at), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{s.title}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground whitespace-nowrap">{SERVICE_LABELS[s.service_type] ?? "General"}</span></td>
                    <td className="px-5 py-3"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{bd.total}</span></td>
                    <td className="px-5 py-3"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{bd.member}</span></td>
                    <td className="px-5 py-3"><span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{bd.non_member}</span></td>
                    <td className="px-5 py-3"><span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">{bd.first_timer}</span></td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${expired ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{expired ? "Ended" : "Live"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
