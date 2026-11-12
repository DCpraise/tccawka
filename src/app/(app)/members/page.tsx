"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, differenceInDays, parseISO } from "date-fns";
import {
  Users, Phone, Search, Download, AlertTriangle, CalendarCheck,
  MapPin, Home, Pencil, X, Check, Star, UserCheck, UserX,
  MessageCircle, Cake, StickyNote, ChevronDown, CheckSquare, Square, History, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

type MemberType = "first_timer" | "member" | "non_member";
type FollowupStatus = "pending" | "called" | "converted" | "not_interested";
type Member = {
  id: string; name: string; phone: string; location: string; lodge: string | null;
  created_at: string; attendance_count: number; last_seen?: string;
  member_type: MemberType; dob?: string | null; notes?: string | null;
  followup_status: FollowupStatus; gender?: string | null;
  fellowship_id?: string | null; fellowship_name?: string | null;
};
type GuestRow = {
  id: string; name: string; phone: string; location: string; lodge: string | null;
  created_at: string; member_type: MemberType; dob?: string | null; notes?: string | null;
  followup_status: FollowupStatus; gender?: string | null;
  fellowship_id?: string | null; fellowships?: { name: string } | null;
};
type RecordRow = { guest_member_id: string; scanned_at: string };
type Fellowship = { id: string; name: string };

const TYPE_META: Record<MemberType, { label: string; color: string; icon: React.ReactNode }> = {
  first_timer: { label: "First Timer", color: "bg-blue-100 text-blue-700 border-blue-200",     icon: <Star className="h-3 w-3" /> },
  member:      { label: "Member",      color: "bg-primary/10 text-primary border-primary/20",   icon: <UserCheck className="h-3 w-3" /> },
  non_member:  { label: "Non Member",  color: "bg-muted text-muted-foreground border-border",   icon: <UserX className="h-3 w-3" /> },
};

const FOLLOWUP_META: Record<FollowupStatus, { label: string; color: string }> = {
  pending:        { label: "Pending",        color: "bg-amber-100 text-amber-700" },
  called:         { label: "Called",         color: "bg-blue-100 text-blue-700" },
  converted:      { label: "Converted",      color: "bg-green-100 text-green-700" },
  not_interested: { label: "Not interested", color: "bg-muted text-muted-foreground" },
};

function getUpcomingBirthdays(members: Member[], withinDays = 30) {
  const today = new Date(); const todayMD = `${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  return members.filter(m => {
    if (!m.dob) return false;
    const md = m.dob.slice(5);
    const thisYear = new Date(today.getFullYear(), parseInt(md.split("-")[0])-1, parseInt(md.split("-")[1]));
    if (thisYear < today) thisYear.setFullYear(today.getFullYear()+1);
    return differenceInDays(thisYear, today) <= withinDays;
  }).sort((a,b) => {
    const toD = (m: Member) => { const md = m.dob!.slice(5); const d = new Date(new Date().getFullYear(), parseInt(md.split("-")[0])-1, parseInt(md.split("-")[1])); if(d<new Date()) d.setFullYear(d.getFullYear()+1); return d.getTime(); };
    return toD(a)-toD(b);
  });
}

export default function MembersPage() {
  const { isStaff, isAdmin, isFellowshipLeader, fellowshipId, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Member | null>(null);
  const [historyMember, setHistoryMember] = useState<Member | null>(null);
  const [filterType, setFilterType] = useState<MemberType | "all">("all");
  const [filterFellowship, setFilterFellowship] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkType, setBulkType] = useState<MemberType>("member");
  const qc = useQueryClient();

  useEffect(() => { if (!loading && !isStaff && !isAdmin && !isFellowshipLeader) router.push("/dashboard"); }, [loading, isStaff, isAdmin, isFellowshipLeader, router]);

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const { data: guestData, error } = await supabase
        .from("guest_members")
        .select("id, name, phone, location, lodge, created_at, member_type, dob, notes, followup_status, gender, fellowship_id, fellowships(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: recordData } = await supabase
        .from("attendance_records").select("guest_member_id, scanned_at")
        .not("guest_member_id", "is", null).order("scanned_at", { ascending: true });
      const records: RecordRow[] = (recordData as RecordRow[] | null) ?? [];
      return ((guestData as unknown as GuestRow[] | null) ?? []).map((m: GuestRow) => {
        const mr = records.filter((r: RecordRow) => r.guest_member_id === m.id);
        return { ...m, attendance_count: mr.length, last_seen: mr.at(-1)?.scanned_at, fellowship_name: m.fellowships?.name ?? null };
      });
    },
  });

  const { data: fellowships = [] } = useQuery<Fellowship[]>({
    queryKey: ["fellowships"],
    queryFn: async () => {
      const { data } = await supabase.from("fellowships").select("id, name").order("name");
      return (data as Fellowship[] | null) ?? [];
    },
  });

  const { data: totalSessions = 0 } = useQuery({
    queryKey: ["total-sessions-count"],
    queryFn: async () => { const { count } = await supabase.from("attendance_sessions").select("*", { count: "exact", head: true }); return count ?? 0; },
  });

  const { data: lastSession } = useQuery<{ id: string; title: string; created_at: string } | null>({
    queryKey: ["last-session"],
    queryFn: async () => {
      const { data } = await supabase.from("attendance_sessions").select("id, title, created_at").lt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return (data as any) ?? null;
    },
  });

  const { data: lastAttendeeIds = [] } = useQuery<string[]>({
    queryKey: ["last-session-attendees", lastSession?.id],
    enabled: !!lastSession,
    queryFn: async () => {
      const { data } = await supabase.from("attendance_records").select("guest_member_id").eq("session_id", lastSession!.id).not("guest_member_id", "is", null);
      return ((data as any[] | null) ?? []).map(r => r.guest_member_id);
    },
  });

  const updateMember = useMutation({
    mutationFn: async (u: Partial<Member> & { id: string }) => {
      const { error } = await (supabase.from("guest_members") as any).update({
        name: u.name?.trim(), phone: u.phone?.trim(), location: u.location?.trim(),
        lodge: u.lodge?.trim() || null, member_type: u.member_type,
        dob: u.dob || null, notes: u.notes?.trim() || null, gender: u.gender || null,
      }).eq("id", u.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); setEditing(null); toast.success("Member updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const changeType = useMutation({
    mutationFn: async ({ id, member_type }: { id: string; member_type: MemberType }) => {
      const { error } = await (supabase.from("guest_members") as any).update({ member_type }).eq("id", id);
      if (error) throw error; return member_type;
    },
    onSuccess: (t) => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success(`Changed to ${TYPE_META[t].label}`); },
    onError: (e: any) => toast.error(e.message),
  });

  const changeFollowup = useMutation({
    mutationFn: async ({ id, followup_status }: { id: string; followup_status: FollowupStatus }) => {
      const { error } = await (supabase.from("guest_members") as any).update({ followup_status }).eq("id", id);
      if (error) throw error; return followup_status;
    },
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: ["members"] }); toast.success(`Follow-up: ${FOLLOWUP_META[s].label}`); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkChangeType = useMutation({
    mutationFn: async ({ ids, member_type }: { ids: string[]; member_type: MemberType }) => {
      const { error } = await (supabase.from("guest_members") as any).update({ member_type }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members"] }); setSelected(new Set()); toast.success(`${selected.size} member${selected.size > 1 ? "s" : ""} updated`); },
    onError: (e: any) => toast.error(e.message),
  });

  const absentees = members.filter(m => m.attendance_count > 0 && lastSession && !lastAttendeeIds.includes(m.id));
  const birthdays = getUpcomingBirthdays(members, 30);
  const firstTimersNeedingFollowup = members.filter(m => m.member_type === "first_timer" && m.followup_status === "pending");

  const scopedMembers = isFellowshipLeader && !isStaff && !isAdmin && fellowshipId
    ? members.filter(m => m.fellowship_id === fellowshipId)
    : members;

  const canManage = isStaff || isAdmin;

  const filtered = scopedMembers.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || m.location.toLowerCase().includes(search.toLowerCase()) || (m.lodge ?? "").toLowerCase().includes(search.toLowerCase()) || (m.fellowship_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.member_type === filterType;
    const matchFellowship = filterFellowship === "all" || m.fellowship_id === filterFellowship;
    return matchSearch && matchType && matchFellowship;
  });

  const counts = {
    all: members.length,
    first_timer: members.filter(m => m.member_type === "first_timer").length,
    member: members.filter(m => m.member_type === "member").length,
    non_member: members.filter(m => m.member_type === "non_member").length,
  };

  const toggleSelect = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(m => m.id)));

  const exportMembers = () => {
    const rows = [["Name","Phone","Gender","Location","Fellowship","Lodge","Status","Follow-up","Birthday","Attended","Last Seen","Joined","Notes"]];
    members.forEach(m => rows.push([m.name, m.phone, m.gender ?? "", m.location, m.fellowship_name ?? "", m.lodge ?? "", TYPE_META[m.member_type].label, FOLLOWUP_META[m.followup_status].label, m.dob ? format(parseISO(m.dob), "MMM d") : "", String(m.attendance_count), m.last_seen ? format(new Date(m.last_seen), "yyyy-MM-dd") : "Never", format(new Date(m.created_at), "yyyy-MM-dd"), m.notes ?? ""]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "tcc-members.csv"; a.click();
  };

  const whatsappBlast = (list: Member[], msg: string) => {
    list.forEach((m, i) => setTimeout(() => window.open(`https://wa.me/${m.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg.replace("{name}", m.name))}`, "_blank"), i * 400));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold">Members</h1><p className="mt-1 text-muted-foreground">{members.length} registered</p></div>
        <button onClick={exportMembers} className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm hover:bg-card"><Download className="h-4 w-4" /> Export</button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Users,         label: "Total members",     value: members.length,              warn: false },
          { icon: Star,          label: "First timers",       value: counts.first_timer,          warn: false },
          { icon: CalendarCheck, label: "Total sessions",     value: totalSessions,               warn: false },
          { icon: AlertTriangle, label: "Absent last service",value: absentees.length,            warn: true  },
        ].map(s => (
          <div key={s.label} className="glass rounded-3xl p-6">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${s.warn ? "bg-amber-100 text-amber-500" : "bg-primary/10 text-primary"}`}><s.icon className="h-5 w-5" /></div>
            <div className="mt-4 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming birthdays */}
      {birthdays.length > 0 && (
        <div className="glass rounded-2xl border border-pink-300/40 bg-pink-50/40 p-5">
          <div className="mb-3 flex items-center gap-2"><Cake className="h-5 w-5 text-pink-500" /><h3 className="font-semibold text-pink-800">Upcoming birthdays · next 30 days</h3></div>
          <div className="flex flex-wrap gap-2">
            {birthdays.map(m => {
              const md = m.dob!.slice(5);
              const bday = new Date(new Date().getFullYear(), parseInt(md.split("-")[0])-1, parseInt(md.split("-")[1]));
              if (bday < new Date()) bday.setFullYear(bday.getFullYear()+1);
              const days = differenceInDays(bday, new Date());
              return (
                <a key={m.id} href={`https://wa.me/${m.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Happy birthday ${m.name}! 🎂 Wishing you God's blessings — TCC Family`)}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs text-pink-800 shadow-sm hover:bg-white transition-colors">
                  <Cake className="h-3 w-3" />
                  <span className="font-medium">{m.name}</span>
                  <span className="opacity-60">{days === 0 ? "Today! 🎉" : `in ${days}d`}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* First timer follow-up */}
      {firstTimersNeedingFollowup.length > 0 && (
        <div className="glass rounded-2xl border border-blue-300/40 bg-blue-50/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-500" /><h3 className="font-semibold text-blue-800">First timers needing follow-up ({firstTimersNeedingFollowup.length})</h3></div>
            <button onClick={() => whatsappBlast(firstTimersNeedingFollowup.slice(0,5), "Hi {name}! 😊 It was great having you at TCC. We'd love to see you again. God bless! — TCC Family")}
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
              <MessageCircle className="h-3 w-3" /> WhatsApp all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {firstTimersNeedingFollowup.slice(0,10).map(m => (
              <div key={m.id} className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs text-blue-800 shadow-sm">
                <Phone className="h-3 w-3" />
                <span className="font-medium">{m.name}</span>
                <a href={`https://wa.me/${m.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="text-[#25D366] hover:underline">{m.phone}</a>
                <button onClick={() => changeFollowup.mutate({ id: m.id, followup_status: "called" })} className="rounded-full bg-blue-100 px-2 py-0.5 hover:bg-blue-200 transition-colors">Mark called</button>
              </div>
            ))}
            {firstTimersNeedingFollowup.length > 10 && <div className="rounded-full bg-white/70 px-3 py-1 text-xs text-blue-600">+{firstTimersNeedingFollowup.length - 10} more</div>}
          </div>
        </div>
      )}

      {/* Absentees */}
      {absentees.length > 0 && lastSession && (
        <div className="glass rounded-2xl border border-amber-400/30 bg-amber-50/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /><h3 className="font-semibold text-amber-800">Absent from {lastSession.title}</h3></div>
            <button onClick={() => whatsappBlast(absentees.slice(0,5), "Hi {name}! We missed you at our last service 🙏 Hope all is well. We'd love to see you soon — TCC Family")}
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
              <MessageCircle className="h-3 w-3" /> WhatsApp all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {absentees.slice(0,12).map(m => (
              <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs text-amber-800 shadow-sm"><Phone className="h-3 w-3" /><span className="font-medium">{m.name}</span><span className="opacity-60">{m.phone}</span></div>
            ))}
            {absentees.length > 12 && <div className="rounded-full bg-white/70 px-3 py-1 text-xs text-amber-600">+{absentees.length - 12} more</div>}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, location or lodge…" className="w-full rounded-2xl border border-border bg-card/60 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1 rounded-2xl border border-border bg-card/40 p-1 overflow-x-auto">
          {(["all","first_timer","member","non_member"] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${filterType === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? `All (${counts.all})` : `${TYPE_META[t].label} (${counts[t]})`}
            </button>
          ))}
        </div>
        <select value={filterFellowship} onChange={e => setFilterFellowship(e.target.value)}
          className="rounded-2xl border border-border bg-card/40 px-3 py-2.5 text-xs font-medium outline-none focus:border-primary">
          <option value="all">All fellowships</option>
          {fellowships.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Bulk actions bar */}
      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Change to:</span>
            <select value={bulkType} onChange={e => setBulkType(e.target.value as MemberType)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary">
              {(["first_timer","member","non_member"] as MemberType[]).map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
            </select>
            <button onClick={() => bulkChangeType.mutate({ ids: Array.from(selected), member_type: bulkType })} disabled={bulkChangeType.isPending}
              className="rounded-xl bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {bulkChangeType.isPending ? "Updating…" : "Apply"}
            </button>
            <button onClick={() => setSelected(new Set())} className="rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass rounded-3xl">
        {isLoading ? <div className="py-16 text-center text-sm text-muted-foreground">Loading members…</div> :
         filtered.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">{search || filterType !== "all" ? "No members match." : "No members yet."}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {canManage && (
                    <th className="px-4 py-3">
                      <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                        {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                  )}
                  {["#","Name","Phone","Location","Fellowship","Lodge","Status","Follow-up","Birthday","Attended","Last seen","Joined","",...(canManage ? [""] : [])].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const absent = absentees.some(a => a.id === m.id);
                  const meta = TYPE_META[m.member_type];
                  const fmeta = FOLLOWUP_META[m.followup_status];
                  const isSel = selected.has(m.id);
                  const md = m.dob?.slice(5);
                  const birthdaySoon = md ? (() => { const d = new Date(new Date().getFullYear(), parseInt(md.split("-")[0])-1, parseInt(md.split("-")[1])); if(d<new Date()) d.setFullYear(d.getFullYear()+1); return differenceInDays(d, new Date()) <= 7; })() : false;
                  return (
                    <tr key={m.id} className={`border-b border-border/40 last:border-0 hover:bg-card/40 ${isSel ? "bg-primary/5" : ""}`}>
                      {canManage && <td className="px-4 py-3"><button onClick={() => toggleSelect(m.id)}>{isSel ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}</button></td>}
                      <td className="px-4 py-3 text-muted-foreground">{i+1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{m.name[0]?.toUpperCase()}</div>
                          <div>
                            <div className="font-medium whitespace-nowrap flex items-center gap-1">
                              {m.name}
                              {m.notes && <span title={m.notes}><StickyNote className="h-3 w-3 text-amber-400" /></span>}
                            </div>
                            {absent && <div className="text-[10px] text-amber-500">Missed last service</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <a href={`https://wa.me/${m.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#25D366] transition-colors">
                          {m.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap"><MapPin className="h-3 w-3 shrink-0 text-primary/50" />{m.location}</div></td>
                      <td className="px-4 py-3">{m.fellowship_name ? <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary whitespace-nowrap">{m.fellowship_name}</span> : <span className="text-muted-foreground/40">—</span>}</td>
                      <td className="px-4 py-3">{m.lodge ? <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap"><Home className="h-3 w-3 shrink-0 text-primary/50" />{m.lodge}</div> : <span className="text-muted-foreground/40">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="relative group">
                          <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${canManage ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${meta.color}`}>{meta.icon} {meta.label}</div>
                          {canManage && <div className="absolute left-0 top-full z-20 mt-1 hidden min-w-[140px] flex-col rounded-2xl border border-border bg-card shadow-lg group-hover:flex">
                            {(["first_timer","member","non_member"] as MemberType[]).map(t => (
                              <button key={t} onClick={() => { if (t !== m.member_type) changeType.mutate({ id: m.id, member_type: t }); }}
                                className={`flex items-center gap-2 px-3 py-2 text-xs hover:bg-primary/10 first:rounded-t-2xl last:rounded-b-2xl ${t === m.member_type ? "font-semibold text-primary" : "text-foreground"}`}>
                                {TYPE_META[t].icon} {TYPE_META[t].label}
                              </button>
                            ))}
                          </div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group">
                          <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${canManage ? "cursor-pointer" : ""} ${fmeta.color}`}>{fmeta.label}</div>
                          {canManage && <div className="absolute left-0 top-full z-20 mt-1 hidden min-w-[150px] flex-col rounded-2xl border border-border bg-card shadow-lg group-hover:flex">
                            {(["pending","called","converted","not_interested"] as FollowupStatus[]).map(s => (
                              <button key={s} onClick={() => { if (s !== m.followup_status) changeFollowup.mutate({ id: m.id, followup_status: s }); }}
                                className={`px-3 py-2 text-left text-xs hover:bg-primary/10 first:rounded-t-2xl last:rounded-b-2xl ${s === m.followup_status ? "font-semibold text-primary" : "text-foreground"}`}>
                                {FOLLOWUP_META[s].label}
                              </button>
                            ))}
                          </div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {m.dob ? (
                          <span className={`flex items-center gap-1 ${birthdaySoon ? "text-pink-500 font-medium" : ""}`}>
                            <Cake className={`h-3 w-3 ${birthdaySoon ? "text-pink-500" : "text-primary/40"}`} />
                            {format(parseISO(m.dob), "MMM d")}
                            {birthdaySoon && " 🎂"}
                          </span>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{m.attendance_count}×</span></td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{m.last_seen ? formatDistanceToNow(new Date(m.last_seen), { addSuffix: true }) : "Never"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(m.created_at), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setHistoryMember(m)} className="flex items-center gap-1 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-card hover:text-primary transition-colors" title="Attendance history">
                          <History className="h-3 w-3" /> History
                        </button>
                      </td>
                      {canManage && <td className="px-4 py-3"><button onClick={() => setEditing(m)} className="flex items-center gap-1 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-xs hover:bg-card hover:text-primary transition-colors"><Pencil className="h-3 w-3" /> Edit</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && <EditModal member={editing} loading={updateMember.isPending} onClose={() => setEditing(null)} onSave={u => updateMember.mutate(u)} />}
      {historyMember && <HistoryModal member={historyMember} onClose={() => setHistoryMember(null)} />}
    </div>
  );
}

function HistoryModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const { data: records = [], isLoading } = useQuery<{ scanned_at: string; title: string; service_type: string }[]>({
    queryKey: ["member-history", member.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance_records")
        .select("scanned_at, attendance_sessions(title, service_type)")
        .eq("guest_member_id", member.id)
        .order("scanned_at", { ascending: false });
      return (data ?? []).map((r: any) => ({ scanned_at: r.scanned_at, title: r.attendance_sessions?.title ?? "Session", service_type: r.attendance_sessions?.service_type ?? "general" }));
    },
  });

  const SERVICE_LABELS: Record<string, string> = {
    general: "General", morning_service: "Morning", evening_service: "Evening",
    midweek: "Midweek", special: "Special",
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl" style={{ maxHeight: "85vh" }}>
        <div className="flex items-start justify-between border-b border-border/60 p-5">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><History className="h-5 w-5 text-primary" /> {member.name}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{records.length} service{records.length !== 1 ? "s" : ""} attended · {TYPE_META[member.member_type].label}{member.fellowship_name ? ` · ${member.fellowship_name}` : ""}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="overflow-y-auto p-5" style={{ maxHeight: "calc(85vh - 90px)" }}>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading history…</div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No attendance records yet.</div>
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><CalendarCheck className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {r.service_type !== "general" && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{SERVICE_LABELS[r.service_type] ?? r.service_type}</span>}
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(r.scanned_at), "MMM d, yyyy · h:mm a")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditModal({ member, loading, onClose, onSave }: { member: Member; loading: boolean; onClose: () => void; onSave: (m: any) => void }) {
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [location, setLocation] = useState(member.location);
  const [lodge, setLodge] = useState(member.lodge ?? "");
  const [memberType, setMemberType] = useState<MemberType>(member.member_type);
  const [gender, setGender] = useState<string>(member.gender ?? "");
  const [dob, setDob] = useState(member.dob ?? "");
  const [notes, setNotes] = useState(member.notes ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl p-6" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Edit member</h2><button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        <form onSubmit={e => { e.preventDefault(); onSave({ id: member.id, name, phone, location, lodge: lodge || null, member_type: memberType, dob: dob || null, notes: notes || null, gender: gender || null }); }} className="space-y-4">
          {[{ label: "Full name", type: "text", val: name, set: setName, req: true }, { label: "Phone number", type: "tel", val: phone, set: setPhone, req: true }, { label: "Location / Junction", type: "text", val: location, set: setLocation, req: true }].map(f => (
            <label key={f.label} className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{f.label}</span>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} required={f.req} className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </label>
          ))}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Lodge <span className="font-normal opacity-60">(optional)</span></span>
            <input type="text" value={lodge} onChange={e => setLodge(e.target.value)} className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Gender <span className="font-normal opacity-60">(optional)</span></span>
            <div className="flex gap-2">
              {(["male","female"] as const).map(g => (
                <button key={g} type="button" onClick={() => setGender(gender === g ? "" : g)}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-medium capitalize transition-all ${gender === g ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card/60 text-muted-foreground hover:bg-card"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          {member.fellowship_name && (
            <p className="text-xs text-muted-foreground">Current fellowship: <span className="font-medium text-primary">{member.fellowship_name}</span>. Changing location will auto-reassign fellowship.</p>
          )}
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground flex items-center gap-1"><Cake className="h-3 w-3" /> Date of birth <span className="font-normal opacity-60">(optional)</span></span>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" /> Pastoral notes <span className="font-normal opacity-60">(staff only)</span></span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="e.g. Prayed for healing. Follow up next week." className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none" />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
            <div className="flex gap-2">
              {(["first_timer","member","non_member"] as MemberType[]).map(t => (
                <button key={t} type="button" onClick={() => setMemberType(t)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-all ${memberType === t ? `${TYPE_META[t].color} shadow-sm` : "border-border bg-card/60 text-muted-foreground hover:bg-card"}`}>
                  {TYPE_META[t].icon} {TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl border border-border bg-card/60 py-2.5 text-sm font-medium hover:bg-card disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Check className="h-4 w-4" />{loading ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
