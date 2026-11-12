"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarCheck, Users, UserCheck, UserX, Star, X, Phone, ChevronDown, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

type MemberType = "first_timer" | "member" | "non_member";

const SERVICE_LABELS: Record<string, string> = {
  general: "General", morning_service: "Morning", evening_service: "Evening",
  midweek: "Midweek", special: "Special",
};

type Session = {
  id: string; title: string; created_at: string; expires_at: string; service_type: string;
};

type Attendee = {
  recordId: string;
  name: string;
  phone: string | null;
  member_type: MemberType;
  fellowship_id: string | null;
  fellowship_name: string | null;
  source: "guest" | "profile";
};

type Fellowship = { id: string; name: string };

const TYPE_META: Record<MemberType, { label: string; icon: React.ReactNode; color: string }> = {
  member:      { label: "Members",      icon: <UserCheck className="h-4 w-4" />, color: "text-primary" },
  non_member:  { label: "Non-members",  icon: <UserX className="h-4 w-4" />,     color: "text-muted-foreground" },
  first_timer: { label: "First-timers", icon: <Star className="h-4 w-4" />,      color: "text-blue-600" },
};

export default function AttendancePage() {
  const { isStaff, isAdmin, isFellowshipLeader, fellowshipId, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isStaff && !isAdmin && !isFellowshipLeader) router.push("/dashboard");
  }, [loading, isStaff, isAdmin, isFellowshipLeader, router]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [expandedFellowship, setExpandedFellowship] = useState<string | null>(null);
  const [listModal, setListModal] = useState<{ title: string; attendees: Attendee[] } | null>(null);

  // ── Sessions list ──────────────────────────────────────────────────────
  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["attendance-page-sessions"],
    enabled: !loading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .select("id, title, created_at, expires_at, service_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Session[] | null) ?? [];
    },
  });

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) setSelectedSessionId(sessions[0].id);
  }, [sessions, selectedSessionId]);

  // ── Fellowships list ───────────────────────────────────────────────────
  const { data: fellowships = [] } = useQuery<Fellowship[]>({
    queryKey: ["attendance-page-fellowships"],
    queryFn: async () => {
      const { data } = await supabase.from("fellowships").select("id, name").order("name");
      return (data as Fellowship[] | null) ?? [];
    },
  });

  // ── Attendees for the selected session ─────────────────────────────────
  const { data: attendees = [], isLoading } = useQuery<Attendee[]>({
    queryKey: ["attendance-page-attendees", selectedSessionId],
    enabled: !!selectedSessionId,
    queryFn: async () => {
      const { data: records, error: rErr } = await supabase
        .from("attendance_records")
        .select("id, user_id, guest_member_id")
        .eq("session_id", selectedSessionId);
      if (rErr) throw rErr;

      const all = records ?? [];
      const guestIds = all.filter((r: any) => r.guest_member_id).map((r: any) => r.guest_member_id as string);
      const userIds = all.filter((r: any) => r.user_id).map((r: any) => r.user_id as string);

      const [guestsRes, profilesRes] = await Promise.all([
        guestIds.length > 0
          ? supabase.from("guest_members").select("id, name, phone, member_type, fellowship_id, fellowships(name)").in("id", guestIds)
          : Promise.resolve({ data: [], error: null }),
        userIds.length > 0
          ? supabase.from("profiles").select("id, name, member_type, fellowship_id, fellowships(name)").in("id", userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (guestsRes.error) throw guestsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const guestMap = new Map((guestsRes.data ?? []).map((g: any) => [g.id, g]));
      const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));

      const result: Attendee[] = [];

      all.forEach((r: any) => {
        if (r.guest_member_id) {
          const g = guestMap.get(r.guest_member_id);
          if (!g) return;
          result.push({
            recordId: r.id,
            name: g.name,
            phone: g.phone ?? null,
            member_type: (g.member_type ?? "first_timer") as MemberType,
            fellowship_id: g.fellowship_id ?? null,
            fellowship_name: g.fellowships?.name ?? null,
            source: "guest",
          });
        } else if (r.user_id) {
          const p = profileMap.get(r.user_id);
          if (!p) return;
          result.push({
            recordId: r.id,
            name: p.name,
            phone: null,
            member_type: (p.member_type ?? "first_timer") as MemberType,
            fellowship_id: p.fellowship_id ?? null,
            fellowship_name: p.fellowships?.name ?? null,
            source: "profile",
          });
        }
      });

      return result;
    },
  });

  // ── Scope attendees to the leader's fellowship, if applicable ───────────
  const scopedAttendees = useMemo(() => {
    if (isFellowshipLeader && !isStaff && !isAdmin && fellowshipId) {
      return attendees.filter(a => a.fellowship_id === fellowshipId);
    }
    return attendees;
  }, [attendees, isFellowshipLeader, isStaff, isAdmin, fellowshipId]);

  // ── Overall totals ───────────────────────────────────────────────────────
  const overallTotals = useMemo(() => {
    const acc = { member: 0, non_member: 0, first_timer: 0 };
    scopedAttendees.forEach(a => { acc[a.member_type] += 1; });
    return acc;
  }, [scopedAttendees]);

  // ── Breakdown by fellowship ───────────────────────────────────────────────
  const fellowshipBreakdown = useMemo(() => {
    const visibleFellowships = isFellowshipLeader && !isStaff && !isAdmin && fellowshipId
      ? fellowships.filter(f => f.id === fellowshipId)
      : fellowships;

    const rows = visibleFellowships.map(f => {
      const members = scopedAttendees.filter(a => a.fellowship_id === f.id && a.member_type === "member");
      const nonMembers = scopedAttendees.filter(a => a.fellowship_id === f.id && a.member_type === "non_member");
      const firstTimers = scopedAttendees.filter(a => a.fellowship_id === f.id && a.member_type === "first_timer");
      return {
        fellowship: f,
        members, nonMembers, firstTimers,
        total: members.length + nonMembers.length + firstTimers.length,
      };
    });

    // Unassigned bucket
    const unassigned = scopedAttendees.filter(a => !a.fellowship_id);
    if (unassigned.length > 0 && !(isFellowshipLeader && !isStaff && !isAdmin)) {
      const members = unassigned.filter(a => a.member_type === "member");
      const nonMembers = unassigned.filter(a => a.member_type === "non_member");
      const firstTimers = unassigned.filter(a => a.member_type === "first_timer");
      rows.push({
        fellowship: { id: "unassigned", name: "Unassigned" },
        members, nonMembers, firstTimers,
        total: members.length + nonMembers.length + firstTimers.length,
      });
    }

    return rows.sort((a, b) => b.total - a.total);
  }, [fellowships, scopedAttendees, isFellowshipLeader, isStaff, isAdmin, fellowshipId]);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="mt-1 text-muted-foreground">
          {isFellowshipLeader && !isStaff && !isAdmin
            ? "View members, non-members, and first-timers from your fellowship for any session."
            : "View members, non-members, and first-timers per session, broken down by fellowship."}
        </p>
      </div>

      {/* Session picker */}
      <div className="glass rounded-3xl p-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select a session</label>
        {sessions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No sessions yet.</div>
        ) : (
          <div className="relative">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-border bg-card/60 px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} · {format(new Date(s.created_at), "MMM d, yyyy")} · {SERVICE_LABELS[s.service_type] ?? "General"}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {selectedSession && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarCheck className="h-3.5 w-3.5" />
            {format(new Date(selectedSession.created_at), "EEEE, MMM d, yyyy · h:mm a")}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="glass rounded-3xl p-10 text-center text-sm text-muted-foreground">Loading attendance…</div>
      ) : !selectedSessionId ? null : (
        <>
          {/* Overall totals */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {(["member", "non_member", "first_timer"] as MemberType[]).map(type => {
              const list = scopedAttendees.filter(a => a.member_type === type);
              const meta = TYPE_META[type];
              return (
                <button
                  key={type}
                  onClick={() => setListModal({ title: `${meta.label} · ${selectedSession?.title ?? ""}`, attendees: list })}
                  className="glass rounded-3xl p-6 text-left transition-transform hover:-translate-y-0.5"
                >
                  <div className={`flex items-center gap-1.5 text-2xl font-bold ${meta.color}`}>
                    {meta.icon}{list.length}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{meta.label} {type !== "member" ? "" : "attended"}</div>
                  <div className="mt-2 text-xs text-primary/70">Tap to view names &amp; phone numbers</div>
                </button>
              );
            })}
          </div>

          <div className="glass rounded-3xl p-4 text-center text-sm text-muted-foreground">
            Total attendance for this session: <span className="font-semibold text-foreground">{scopedAttendees.length}</span>
          </div>

          {/* Per-fellowship breakdown */}
          <div className="glass rounded-3xl">
            <div className="border-b border-border/60 px-6 py-4">
              <h2 className="font-display text-lg font-semibold">
                {isFellowshipLeader && !isStaff && !isAdmin ? "Your fellowship" : "Breakdown by fellowship"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedSession ? `${selectedSession.title} · ${format(new Date(selectedSession.created_at), "MMM d, yyyy")}` : ""}
              </p>
            </div>

            {fellowshipBreakdown.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No attendance data for this session.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {fellowshipBreakdown.map(row => {
                  const isOpen = expandedFellowship === row.fellowship.id;
                  return (
                    <div key={row.fellowship.id}>
                      <button
                        onClick={() => setExpandedFellowship(isOpen ? null : row.fellowship.id)}
                        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-card/30"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">{row.fellowship.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary whitespace-nowrap">{row.members.length} members</span>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{row.nonMembers.length} non-members</span>
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap">{row.firstTimers.length} first-timers</span>
                          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">Total {row.total}</span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-4 grid gap-3 sm:grid-cols-3">
                          {(["member", "non_member", "first_timer"] as MemberType[]).map(type => {
                            const meta = TYPE_META[type];
                            const list = row[type === "member" ? "members" : type === "non_member" ? "nonMembers" : "firstTimers"];
                            return (
                              <button
                                key={type}
                                onClick={() => setListModal({ title: `${meta.label} · ${row.fellowship.name}`, attendees: list })}
                                disabled={list.length === 0}
                                className="rounded-2xl border border-border/60 bg-card/40 p-3 text-left transition-colors hover:bg-card/70 disabled:cursor-default disabled:opacity-60"
                              >
                                <div className={`flex items-center gap-1.5 text-lg font-bold ${meta.color}`}>{meta.icon}{list.length}</div>
                                <div className="text-xs text-muted-foreground">{meta.label}</div>
                                {list.length > 0 && <div className="mt-1 text-[10px] text-primary/70">Tap to view list</div>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Attendee list modal */}
      {listModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setListModal(null)}>
          <div className="glass max-h-[80vh] w-full max-w-md overflow-hidden rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <h3 className="font-display font-semibold">{listModal.title}</h3>
              <button onClick={() => setListModal(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {listModal.attendees.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No one in this category.</div>
              ) : (
                <ul className="divide-y divide-border/30">
                  {listModal.attendees.map(a => (
                    <li key={a.recordId} className="flex items-center justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{a.name}</div>
                        {a.fellowship_name && <div className="text-xs text-muted-foreground">{a.fellowship_name}</div>}
                      </div>
                      {a.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <Phone className="h-3.5 w-3.5" />{a.phone}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <Users className="h-3.5 w-3.5" />App user
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
