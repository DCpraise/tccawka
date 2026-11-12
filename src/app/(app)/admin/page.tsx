"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Plus, Download, Users, Clock, Copy, X, Maximize2, Share2, Printer,
  ChevronRight, Timer, StopCircle, AlertCircle, Trash2, ShieldCheck,
  ShieldOff, UserCog, Search, Mail, UserCheck, UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

type Session = { id: string; title: string; description?: string | null; qr_token: string; expires_at: string; created_at: string; attendance_records?: { count: number }[] };
type AttendeeRecord = { id: string; scanned_at: string; user_id: string | null; guest_member_id: string | null; profiles?: any; guest_members?: any };
type ConfirmAction = { type: "close"|"delete"; session: Session } | null;

// Safe UUID generator — works on HTTP and older browsers
function generateToken(): string {
  const arr = new Uint8Array(16);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const h = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}-${Date.now().toString(36)}`;
}

export default function AdminPage() {
  const { user, isStaff, isAdmin, loading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"sessions"|"roles">("sessions");
  const [showCreate, setShowCreate] = useState(false);
  const [activeQR, setActiveQR] = useState<Session | null>(null);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [manualCheckinSession, setManualCheckinSession] = useState<Session | null>(null);
  const [walkinSession, setWalkinSession] = useState<Session | null>(null);
  const [walkinRegistrationOnly, setWalkinRegistrationOnly] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => { if (!loading && !isStaff && !isAdmin) router.push("/dashboard"); }, [loading, isStaff, isAdmin, router]);

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["sessions"],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_sessions").select("*, attendance_records(count)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Session[];
    },
  });

  const createSession = useMutation({
    mutationFn: async ({ title, description, minutes, service_type }: any) => {
      const qr_token = generateToken();
      const expires_at = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      const { data, error } = await (supabase.from("attendance_sessions") as any).insert({ title, description, qr_token, expires_at, created_by: user!.id, service_type: service_type ?? "general" }).select().single();
      if (error) throw error;
      return data as Session;
    },
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: ["sessions"] }); setShowCreate(false); setActiveQR(s); toast.success("Session created!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const extendSession = useMutation({
    mutationFn: async ({ id, minutes }: { id: string; minutes: number }) => {
      const { data: cur, error: fetchErr } = await supabase.from("attendance_sessions").select("expires_at").eq("id", id).single();
      if (fetchErr) throw fetchErr;
      const base = cur && new Date((cur as any).expires_at) > new Date() ? new Date((cur as any).expires_at) : new Date();
      const expires_at = new Date(base.getTime() + minutes * 60 * 1000).toISOString();
      const { error } = await (supabase.from("attendance_sessions") as any).update({ expires_at }).eq("id", id);
      if (error) throw error;
      return expires_at;
    },
    onSuccess: (exp) => { qc.invalidateQueries({ queryKey: ["sessions"] }); toast.success(`Extended — expires ${formatDistanceToNow(new Date(exp), { addSuffix: true })}`); },
    onError: (e: any) => toast.error(e.message),
  });

  const closeSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("attendance_sessions") as any).update({ expires_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); setConfirmAction(null); toast.success("Session stopped"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error: r } = await (supabase.from("attendance_records") as any).delete().eq("session_id", id);
      if (r) throw r;
      const { error: s } = await (supabase.from("attendance_sessions") as any).delete().eq("id", id);
      if (s) throw s;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); setConfirmAction(null); toast.success("Session deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const active = sessions.filter(s => new Date(s.expires_at) > new Date());
  const past = sessions.filter(s => new Date(s.expires_at) <= new Date());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-bold">Admin</h1><p className="mt-1 text-muted-foreground">Sessions and team management</p></div>
        {tab === "sessions" && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setWalkinRegistrationOnly(true)} className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium hover:bg-card">
              <UserPlus className="h-4 w-4" /> Register visitor
            </button>
            <button onClick={() => setManualCheckinSession(active[0] ?? null)} disabled={active.length === 0} title={active.length === 0 ? "No live session — manual check-in is disabled" : undefined} className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-5 py-2.5 text-sm font-medium hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed">
              <UserCheck className="h-4 w-4" /> Manual check-in
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90">
              <Plus className="h-4 w-4" /> New session
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-border bg-card/40 p-1 w-fit">
        {[{ k: "sessions", l: "Sessions" }, ...(isAdmin ? [{ k: "roles", l: "Role Management" }] : [])].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === t.k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" /> Live now
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {active.map(s => <SessionCard key={s.id} session={s} onShowQR={() => setActiveQR(s)} onViewAttendees={() => setViewingSession(s)} onManualCheckin={() => setManualCheckinSession(s)} onWalkin={() => setWalkinSession(s)} onExtend={m => extendSession.mutate({ id: s.id, minutes: m })} onClose={() => setConfirmAction({ type: "close", session: s })} onDelete={() => setConfirmAction({ type: "delete", session: s })} onExport={() => exportCsv(s.id, s.title)} extendPending={extendSession.isPending} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Past sessions</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {past.map(s => <SessionCard key={s.id} session={s} onShowQR={() => setActiveQR(s)} onViewAttendees={() => setViewingSession(s)} onManualCheckin={() => setManualCheckinSession(s)} onWalkin={() => setWalkinSession(s)} onExtend={m => extendSession.mutate({ id: s.id, minutes: m })} onClose={() => setConfirmAction({ type: "close", session: s })} onDelete={() => setConfirmAction({ type: "delete", session: s })} onExport={() => exportCsv(s.id, s.title)} extendPending={extendSession.isPending} />)}
              </div>
            </div>
          )}
          {sessions.length === 0 && <div className="glass rounded-3xl p-16 text-center text-muted-foreground"><Plus className="mx-auto mb-3 h-10 w-10 opacity-30" /><p>No sessions yet. Create your first one.</p></div>}
        </div>
      )}

      {tab === "roles" && isAdmin && <RoleManagement currentUserId={user!.id} />}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={p => createSession.mutate(p)} loading={createSession.isPending} />}
      {activeQR && <QRModal session={activeQR} onClose={() => setActiveQR(null)} />}
      {viewingSession && <AttendeesModal session={viewingSession} onClose={() => setViewingSession(null)} />}
      {manualCheckinSession && <ManualCheckinModal session={manualCheckinSession} onClose={() => setManualCheckinSession(null)} sessions={sessions} onSwitchSession={setManualCheckinSession} />}
      {walkinSession && <WalkinModal session={walkinSession} onClose={() => setWalkinSession(null)} sessions={sessions} onSwitchSession={setWalkinSession} />}
      {walkinRegistrationOnly && <WalkinModal session={null} onClose={() => setWalkinRegistrationOnly(false)} sessions={sessions} onSwitchSession={() => {}} registrationOnly />}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === "delete" ? "Delete session?" : "Stop session?"}
          description={confirmAction.type === "delete" ? `Permanently delete "${confirmAction.session.title}" and all its attendance records?` : `Stop "${confirmAction.session.title}" from accepting check-ins?`}
          confirmLabel={confirmAction.type === "delete" ? "Delete permanently" : "Stop session"}
          loading={deleteSession.isPending || closeSession.isPending}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => confirmAction.type === "delete" ? deleteSession.mutate(confirmAction.session.id) : closeSession.mutate(confirmAction.session.id)}
        />
      )}
    </div>
  );
}

function SessionCard({ session: s, onShowQR, onViewAttendees, onManualCheckin, onWalkin, onExtend, onClose, onDelete, onExport, extendPending }: any) {
  const expired = new Date(s.expires_at) < new Date();
  const count = s.attendance_records?.[0]?.count ?? 0;
  const [showExtend, setShowExtend] = useState(false);
  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{s.title}</h3>
          {s.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.description}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${expired ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{expired ? "Ended" : "Live"}</span>
          <button onClick={onDelete} className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <button onClick={onViewAttendees} className="flex items-center gap-1 hover:text-primary transition-colors"><Users className="h-3 w-3" /> {count} attended <ChevronRight className="h-3 w-3" /></button>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{expired ? `Ended ${formatDistanceToNow(new Date(s.expires_at), { addSuffix: true })}` : `Expires ${formatDistanceToNow(new Date(s.expires_at), { addSuffix: true })}`}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={onShowQR} className="flex-1 rounded-xl bg-primary py-2 text-xs font-medium text-primary-foreground hover:opacity-90">{expired ? "View QR" : "Show QR"}</button>
        <button onClick={onWalkin} disabled={expired} title={expired ? "Session has ended — walk-in check-in is disabled" : "Walk-in registration & check-in"} className="rounded-xl border border-border bg-card/60 px-3 py-2 hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed"><UserPlus className="h-3.5 w-3.5" /></button>
        <button onClick={onManualCheckin} disabled={expired} title={expired ? "Session has ended — manual check-in is disabled" : "Manual check-in"} className="rounded-xl border border-border bg-card/60 px-3 py-2 hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed"><UserCheck className="h-3.5 w-3.5" /></button>
        <button onClick={onViewAttendees} className="rounded-xl border border-border bg-card/60 px-3 py-2 hover:bg-card"><Users className="h-3.5 w-3.5" /></button>
        <button onClick={onExport} className="rounded-xl border border-border bg-card/60 px-3 py-2 hover:bg-card"><Download className="h-3.5 w-3.5" /></button>
      </div>
      <div className="flex gap-2 border-t border-border/60 pt-3">
        <button onClick={() => setShowExtend(!showExtend)} disabled={extendPending} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-card/60 py-1.5 text-xs hover:bg-card disabled:opacity-50">
          <Timer className="h-3 w-3" /> {expired ? "Reopen" : "Extend"}
        </button>
        {!expired && <button onClick={onClose} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-destructive/30 bg-destructive/5 py-1.5 text-xs text-destructive hover:bg-destructive/10"><StopCircle className="h-3 w-3" /> Stop now</button>}
      </div>
      {showExtend && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground">{expired ? "Reopen for:" : "Add time:"}</p>
          <div className="flex gap-2">
            {[15, 30, 60, 120].map(m => (
              <button key={m} onClick={() => { onExtend(m); setShowExtend(false); }} disabled={extendPending}
                className="flex-1 rounded-xl bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50">
                {m >= 60 ? `${m/60}h` : `${m}m`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QRModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const expired = new Date(session.expires_at) < new Date();
  const scanUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/checkin?token=${session.qr_token}`;
  useEffect(() => { QRCode.toDataURL(scanUrl, { width: 600, margin: 2, color: { dark: "#3b1d8a", light: "#ffffff" } }).then(setDataUrl); }, [scanUrl]);
  if (fullscreen) return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white">
      <button onClick={() => setFullscreen(false)} className="absolute right-4 top-4 rounded-full bg-black/10 p-2"><X className="h-5 w-5" /></button>
      <p className="mb-4 text-lg font-bold text-gray-800">{session.title}</p>
      {dataUrl && <img src={dataUrl} alt="QR" className="w-[min(90vw,90vh)]" />}
      <p className="mt-4 text-sm text-gray-500">Scan with phone camera · The Crowned Church</p>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{session.title}</h2>
            <p className="text-xs text-muted-foreground">{expired ? "Session ended" : `Expires ${formatDistanceToNow(new Date(session.expires_at), { addSuffix: true })}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFullscreen(true)} className="rounded-lg border border-border p-2 hover:bg-card"><Maximize2 className="h-4 w-4" /></button>
            <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
        </div>
        {expired && <div className="mb-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground"><AlertCircle className="h-3.5 w-3.5" />Session ended — members can no longer check in.</div>}
        <div className="grid place-items-center rounded-2xl bg-white p-4 shadow-inner">
          {dataUrl ? <img src={dataUrl} alt="QR" className="h-72 w-72" /> : <div className="h-72 w-72 animate-pulse rounded-xl bg-muted" />}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => { navigator.clipboard.writeText(scanUrl); toast.success("Link copied"); }} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 py-2.5 text-xs font-medium hover:bg-card"><Copy className="h-3.5 w-3.5" /> Copy link</button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`✝️ *${session.title}* — TCC Attendance\nScan to mark attendance:\n${scanUrl}`)}`, "_blank")} className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-xs font-medium text-white hover:opacity-90"><Share2 className="h-3.5 w-3.5" /> WhatsApp</button>
          <button onClick={() => { const w = window.open("","_blank")!; w.document.write(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;gap:16px"><img src="${dataUrl}" style="width:320px"/><h2>${session.title}</h2><p>Scan to mark attendance · The Crowned Church</p></body></html>`); w.print(); }} className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 py-2.5 text-xs font-medium hover:bg-card"><Printer className="h-3.5 w-3.5" /> Print QR</button>
        </div>
      </div>
    </div>
  );
}

function AttendeesModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const { data: records = [], isLoading } = useQuery<AttendeeRecord[]>({
    queryKey: ["attendees", session.id],
    queryFn: async () => {
      // Step 1: fetch attendance records
      const { data: rows, error } = await supabase.from("attendance_records")
        .select("id, scanned_at, user_id, guest_member_id")
        .eq("session_id", session.id).order("scanned_at");
      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      // Step 2: fetch profiles and guests separately (avoids RLS join restrictions)
      const userIds = rows.filter((r: any) => r.user_id).map((r: any) => r.user_id);
      const guestIds = rows.filter((r: any) => r.guest_member_id).map((r: any) => r.guest_member_id);

      const [profilesRes, guestsRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("id, name, email").in("id", userIds)
          : Promise.resolve({ data: [] }),
        guestIds.length > 0
          ? supabase.from("guest_members").select("id, name, phone").in("id", guestIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data ?? []).forEach((p: any) => { profileMap[p.id] = p; });
      const guestMap: Record<string, any> = {};
      (guestsRes.data ?? []).forEach((g: any) => { guestMap[g.id] = g; });

      return rows.map((r: any) => ({
        ...r,
        profiles: r.user_id ? profileMap[r.user_id] ?? null : null,
        guest_members: r.guest_member_id ? guestMap[r.guest_member_id] ?? null : null,
      })) as AttendeeRecord[];
    },
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass flex w-full max-w-lg flex-col rounded-3xl" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <div><h2 className="text-xl font-bold">{session.title}</h2><p className="text-xs text-muted-foreground">{records.length} attended</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportCsv(session.id, session.title)} className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs hover:bg-card"><Download className="h-3.5 w-3.5" /> Export</button>
            <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div> :
           records.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">No one has checked in yet.</div> : (
            <div className="space-y-2">
              {records.map((r, i) => {
                const isGuest = !r.user_id;
                const name = isGuest ? r.guest_members?.name : r.profiles?.name;
                const contact = isGuest ? r.guest_members?.phone : r.profiles?.email;
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i+1}</div>
                    <div className="min-w-0 flex-1"><div className="truncate font-medium">{name ?? "Unknown"}</div><div className="truncate text-xs text-muted-foreground">{contact}</div></div>
                    <div className="shrink-0 text-right"><div className="text-xs text-muted-foreground">{format(new Date(r.scanned_at), "HH:mm")}</div><div className={`text-[10px] ${isGuest ? "text-accent" : "text-primary"}`}>{isGuest ? "Guest" : "Member"}</div></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          {format(new Date(session.created_at), "MMM d, yyyy")} · {format(new Date(session.created_at), "HH:mm")} – {format(new Date(session.expires_at), "HH:mm")}
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreate, loading }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [serviceType, setServiceType] = useState("general");
  const SERVICE_TYPES = [
    { v: "general", l: "General" },
    { v: "morning_service", l: "Morning" },
    { v: "evening_service", l: "Evening" },
    { v: "midweek", l: "Midweek" },
    { v: "special", l: "Special" },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">New session</h2><button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        <form onSubmit={e => { e.preventDefault(); onCreate({ title, description, minutes, service_type: serviceType }); }} className="space-y-4">
          <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label><input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Sunday Service" className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Service type</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TYPES.map(t => (
                <button key={t.v} type="button" onClick={() => setServiceType(t.v)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${serviceType === t.v ? "bg-primary text-primary-foreground" : "border border-border bg-card/60 text-muted-foreground hover:bg-card"}`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Duration</label>
            <div className="mb-2 flex gap-2">
              {[{l:"1hr",v:60},{l:"2hr",v:120},{l:"3hr",v:180}].map(p => <button key={p.v} type="button" onClick={() => setMinutes(p.v)} className={`flex-1 rounded-xl py-2 text-xs font-medium ${minutes===p.v?"bg-primary text-primary-foreground":"border border-border bg-card/60 hover:bg-card"}`}>{p.l}</button>)}
            </div>
            <div className="flex items-center gap-2"><input type="number" min={1} max={1440} value={minutes} onChange={e => setMinutes(Number(e.target.value))} required className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary" /><span className="shrink-0 text-sm text-muted-foreground">min</span></div>
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{loading ? "Creating…" : "Create & generate QR"}</button>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ title, description, confirmLabel, loading, onCancel, onConfirm }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-3xl p-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-border bg-card/60 py-2.5 text-sm font-medium hover:bg-card disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{loading ? "Please wait…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function RoleManagement({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [leaderPicker, setLeaderPicker] = useState<string | null>(null);

  const { data: fellowshipsList = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["fellowships"],
    queryFn: async () => {
      const { data } = await supabase.from("fellowships").select("id, name").order("name");
      return (data as any[] | null) ?? [];
    },
  });

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").order("name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role, fellowship_id, fellowships(name)");
      const roleMap: Record<string, string[]> = {};
      const fellowshipMap: Record<string, string> = {};
      (roles ?? []).forEach((r: any) => {
        if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
        roleMap[r.user_id].push(r.role);
        if (r.role === "fellowship_leader") fellowshipMap[r.user_id] = r.fellowships?.name ?? "";
      });
      return (profiles ?? []).map((p: any) => ({ ...p, roles: roleMap[p.id] ?? ["user"], leaderFellowship: fellowshipMap[p.id] }));
    },
  });

  const grant = useMutation({
    mutationFn: async ({ userId, role, fellowshipId }: { userId: string; role: string; fellowshipId?: string }) => {
      const { error } = await (supabase.from("user_roles") as any).upsert({ user_id: userId, role, fellowship_id: fellowshipId ?? null }, { onConflict: "user_id,role" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff-users"] }); toast.success("Role granted"); setLeaderPicker(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await (supabase.from("user_roles") as any).delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff-users"] }); toast.success("Role revoked"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> Team & Roles</h2><p className="mt-1 text-sm text-muted-foreground">Grant or revoke Admin and Staff access.</p></div>
        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/auth`); toast.success("Invite link copied!"); }} className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm hover:bg-card"><Mail className="h-4 w-4" /> Copy invite link</button>
      </div>
      <div className="glass rounded-2xl p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role permissions</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[{r:"Admin",d:"Full access: sessions, members, analytics, roles",c:"text-primary"},{r:"Staff",d:"Check-in, registration, full member access (Attendance Officer)",c:"text-accent"},{r:"Fellowship Leader",d:"View members and reports for their fellowship only",c:"text-blue-600"},{r:"Member",d:"Can scan QR and view their own dashboard",c:"text-muted-foreground"}].map(x => (
            <div key={x.r} className="rounded-xl border border-border/60 bg-card/40 px-3 py-2"><div className={`text-sm font-semibold ${x.c}`}>{x.r}</div><div className="mt-0.5 text-xs text-muted-foreground">{x.d}</div></div>
          ))}
        </div>
      </div>
      <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full rounded-2xl border border-border bg-card/60 py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
      <div className="glass rounded-3xl overflow-hidden">
        {isLoading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading users…</div> :
         filtered.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{search ? "No users match." : "No users yet."}</div> : (
          <div className="divide-y divide-border/40">
            {filtered.map((u: any) => {
              const isMe = u.id === currentUserId;
              const hasAdmin = u.roles.includes("admin");
              const hasStaff = u.roles.includes("staff");
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-card/30">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">{u.name?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="truncate font-medium">{u.name || "—"}</span>{isMe && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">You</span>}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {u.roles.filter((r: string) => r !== "user" && r !== "fellowship_leader").map((r: string) => <span key={r} className="rounded-full border border-border bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">{r}</span>)}
                    {u.roles.includes("fellowship_leader") && <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">Leader · {u.leaderFellowship || "—"}</span>}
                    {u.roles.every((r: string) => r === "user") && <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Member</span>}
                  </div>
                  {!isMe && (
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <button onClick={() => hasAdmin ? revoke.mutate({ userId: u.id, role: "admin" }) : grant.mutate({ userId: u.id, role: "admin" })}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${hasAdmin ? "border-primary/30 bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "border-border bg-card/60 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30"}`}>
                        {hasAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}{hasAdmin ? "Remove Admin" : "Make Admin"}
                      </button>
                      {!hasAdmin && (
                        <button onClick={() => hasStaff ? revoke.mutate({ userId: u.id, role: "staff" }) : grant.mutate({ userId: u.id, role: "staff" })}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${hasStaff ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "border-border bg-card/60 text-muted-foreground hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"}`}>
                          {hasStaff ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}{hasStaff ? "Remove Staff" : "Make Staff"}
                        </button>
                      )}
                      {!hasAdmin && !hasStaff && (
                        u.roles.includes("fellowship_leader") ? (
                          <button onClick={() => revoke.mutate({ userId: u.id, role: "fellowship_leader" })}
                            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                            <ShieldOff className="h-3.5 w-3.5" /> Remove Leader
                          </button>
                        ) : leaderPicker === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <select onChange={e => { if (e.target.value) grant.mutate({ userId: u.id, role: "fellowship_leader", fellowshipId: e.target.value }); }}
                              defaultValue=""
                              className="rounded-xl border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary">
                              <option value="" disabled>Choose fellowship…</option>
                              {fellowshipsList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <button onClick={() => setLeaderPicker(null)} className="rounded-xl border border-border bg-card/60 px-2 py-1.5 text-xs hover:bg-card">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setLeaderPicker(u.id)}
                            className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
                            <ShieldCheck className="h-3.5 w-3.5" /> Make Leader
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


function WalkinModal({ session, onClose, sessions, onSwitchSession, registrationOnly = false }: { session: Session | null; onClose: () => void; sessions: Session[]; onSwitchSession: (s: Session) => void; registrationOnly?: boolean }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [location, setLocation] = useState("");
  const [lodge, setLodge] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [lastCheckedIn, setLastCheckedIn] = useState<string>("");
  const [lastFellowship, setLastFellowship] = useState<string>("");

  const { data: locationOptions = [] } = useQuery<string[]>({
    queryKey: ["location-options"],
    queryFn: async () => {
      const { data } = await supabase.from("location_fellowship_map").select("location").order("location");
      return (data ?? []).map((r: any) => r.location);
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      // 1. Check if guest with this phone already exists
      const { data: existing } = await supabase
        .from("guest_members")
        .select("id, name")
        .eq("phone", phone.trim())
        .maybeSingle();

      let guestId: string;

      if (existing) {
        // Guest exists — just check them in
        guestId = existing.id;
      } else {
        // Create new guest member
        const { data: newGuest, error: insertErr } = await (supabase.from("guest_members") as any)
          .insert({ name: name.trim(), phone: phone.trim(), location: location.trim(), lodge: lodge.trim() || null, member_type: 'first_timer', gender: gender || null })
          .select("id, fellowship_id, fellowships(name)")
          .single();
        if (insertErr) throw insertErr;
        guestId = newGuest.id;
      }

      // Fetch fellowship name for the success screen
      const { data: guestInfo } = await supabase.from("guest_members").select("name, fellowships(name)").eq("id", guestId).maybeSingle();

      // 2. Mark attendance — ignore duplicate error (already checked in)
      // Skipped entirely in registration-only mode (no live session, or QR-fallback registration)
      if (!registrationOnly && session) {
        const { error: attErr } = await (supabase.from("attendance_records") as any).insert({
          session_id: session.id,
          guest_member_id: guestId,
          scanned_at: new Date().toISOString(),
        });
        if (attErr && attErr.code !== "23505") throw attErr;
      }

      return { name: (guestInfo as any)?.name ?? name.trim(), fellowship: (guestInfo as any)?.fellowships?.name ?? "" };
    },
    onSuccess: ({ name: checkedInName, fellowship }) => {
      if (session) {
        qc.invalidateQueries({ queryKey: ["attendees", session.id] });
        qc.invalidateQueries({ queryKey: ["sessions"] });
      }
      setLastCheckedIn(checkedInName);
      setLastFellowship(fellowship);
      setStep("success");
    },
    onError: (e: any) => {
      if (e.message?.includes("unique") || e.code === "23505") {
        toast("Already registered", { description: "This phone number is already checked in for this session." });
      } else {
        toast.error(e.message ?? "Something went wrong");
      }
    },
  });

  const reset = () => {
    setName(""); setPhone(""); setGender(""); setLocation(""); setLodge("");
    setStep("form"); submit.reset();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 p-5">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> {registrationOnly ? "Register Visitor" : "Walk-in Registration"}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{registrationOnly ? "Registration only — not tied to a session" : session?.title}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Session switcher (active sessions only) */}
        {!registrationOnly && (() => {
          const activeSessions = sessions.filter(s => new Date(s.expires_at) > new Date());
          return activeSessions.length > 1 && (
            <div className="border-b border-border/60 px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Session</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeSessions.map(s => (
                  <button key={s.id} onClick={() => onSwitchSession(s)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${s.id === session?.id ? "bg-primary text-primary-foreground" : "border border-border bg-card/60 text-muted-foreground hover:bg-card"}`}>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {step === "success" ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <UserCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{lastCheckedIn}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {registrationOnly
                  ? "Registered successfully. They can be checked in once a session is live."
                  : <>Registered and checked in to <span className="font-medium text-foreground">{session?.title}</span></>}
              </p>
              {lastFellowship && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Assigned to {lastFellowship}
                </p>
              )}
            </div>
            <div className="flex w-full gap-3 pt-2">
              <button onClick={reset} className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
                Register another
              </button>
              <button onClick={onClose} className="flex-1 rounded-xl border border-border bg-card/60 py-3 text-sm font-medium hover:bg-card">
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Registration form */
          <div className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              {registrationOnly
                ? "Use this if a visitor's QR code isn't scanning. Fill in their details to register them — they won't be checked in until a session is live."
                : "Fill in the visitor's details. If they've visited before, entering their phone number will find them automatically."}
            </p>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full name <span className="text-destructive">*</span></label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. John Adewale"
                className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone number <span className="text-destructive">*</span></label>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                type="tel"
                className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Used to identify returning visitors</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Gender <span className="text-muted-foreground text-[10px] font-normal">(optional)</span></label>
              <div className="flex gap-2">
                {(["male","female"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(gender === g ? "" : g)}
                    className={`flex-1 rounded-xl border py-2.5 text-xs font-medium capitalize transition-all ${gender === g ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card/60 text-muted-foreground hover:bg-card"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Location / Area <span className="text-destructive">*</span></label>
              <input
                value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Amansea"
                list="walkin-location-options"
                className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="walkin-location-options">
                {locationOptions.map(l => <option key={l} value={l} />)}
              </datalist>
              <p className="mt-1 text-[10px] text-muted-foreground">Fellowship is assigned automatically based on location</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lodge / Unit <span className="text-muted-foreground text-[10px] font-normal">(optional)</span></label>
              <input
                value={lodge} onChange={e => setLodge(e.target.value)}
                placeholder="e.g. Youth Lodge"
                className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={() => {
                if (!name.trim()) { toast.error("Name is required"); return; }
                if (!phone.trim()) { toast.error("Phone number is required"); return; }
                if (!location.trim()) { toast.error("Location is required"); return; }
                submit.mutate();
              }}
              disabled={submit.isPending}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-50">
              {submit.isPending ? "Registering…" : registrationOnly ? "Register" : "Register & Check in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function ManualCheckinModal({ session, onClose, sessions, onSwitchSession }: { session: Session; onClose: () => void; sessions: Session[]; onSwitchSession: (s: Session) => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  // Fetch all members (registered profiles)
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery<any[]>({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name, email, member_type, fellowships(name)").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch all guests (walk-ins / QR self-registrations)
  const { data: guests = [], isLoading: loadingGuests } = useQuery<any[]>({
    queryKey: ["all-guests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("guest_members").select("id, name, phone, member_type, fellowships(name)").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const loadingMembers = loadingProfiles || loadingGuests;

  // Unified list: profiles tagged "profile", guests tagged "guest"
  const members = useMemo(() => [
    ...profiles.map((p: any) => ({ ...p, source: "profile" as const })),
    ...guests.map((g: any) => ({ ...g, email: g.phone, source: "guest" as const })),
  ], [profiles, guests]);

  // Fetch who already checked in to this session (both user_id and guest_member_id)
  const { data: existing = [] } = useQuery<string[]>({
    queryKey: ["existing-checkins", session.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_records")
        .select("user_id, guest_member_id").eq("session_id", session.id);
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => r.user_id ? `profile-${r.user_id}` : r.guest_member_id ? `guest-${r.guest_member_id}` : null)
        .filter(Boolean) as string[];
    },
    refetchInterval: 10000,
  });

  useEffect(() => { setCheckedIn(new Set(existing)); }, [existing]);

  const markAttendance = useMutation({
    mutationFn: async (member: any) => {
      const key = `${member.source}-${member.id}`;
      // Check if already checked in
      if (checkedIn.has(key)) {
        toast("Already checked in", { description: `${member.name} is already marked for this session.` });
        return;
      }
      const insertPayload = member.source === "guest"
        ? { session_id: session.id, guest_member_id: member.id, scanned_at: new Date().toISOString() }
        : { session_id: session.id, user_id: member.id, scanned_at: new Date().toISOString() };
      const { error } = await (supabase.from("attendance_records") as any).insert(insertPayload);
      if (error) {
        if (error.code === "23505") {
          toast("Already checked in", { description: `${member.name} is already marked.` });
          setCheckedIn(prev => new Set(prev).add(key));
          return;
        }
        throw error;
      }
      setCheckedIn(prev => new Set(prev).add(key));
      qc.invalidateQueries({ queryKey: ["attendees", session.id] });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["existing-checkins", session.id] });
      toast.success(`${member.name} checked in!`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="glass flex w-full max-w-lg flex-col rounded-3xl" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 p-5">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Manual Check-in</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{session.title}</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        {/* Session switcher (active sessions only) */}
        {(() => {
          const activeSessions = sessions.filter(s => new Date(s.expires_at) > new Date());
          return activeSessions.length > 1 && (
            <div className="border-b border-border/60 px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Switch session</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeSessions.map(s => (
                  <button key={s.id} onClick={() => onSwitchSession(s)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${s.id === session.id ? "bg-primary text-primary-foreground" : "border border-border bg-card/60 text-muted-foreground hover:bg-card"}`}>
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{checkedIn.size} checked in · {members.length} people total</p>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loadingMembers ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading members…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{search ? "No members match your search." : "No members found."}</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((m: any) => {
                const done = checkedIn.has(`${m.source}-${m.id}`);
                return (
                  <div key={`${m.source}-${m.id}`} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${done ? "border-primary/20 bg-primary/5" : "border-border/60 bg-card/40"}`}>
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                      {done ? <UserCheck className="h-4 w-4" /> : (m.name?.[0]?.toUpperCase() ?? "?")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium flex items-center gap-1.5">
                        {m.name ?? "—"}
                        {m.member_type && <span className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary capitalize">{m.member_type.replace("_"," ")}</span>}
                        {m.source === "guest" && <span className="rounded-full bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground">Guest</span>}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.email}{m.fellowships?.name ? ` · ${m.fellowships.name}` : ""}</div>
                    </div>
                    <button
                      onClick={() => markAttendance.mutate(m)}
                      disabled={done || markAttendance.isPending}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-medium transition-all ${done ? "bg-primary/10 text-primary cursor-default" : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"}`}>
                      {done ? "Done ✓" : "Check in"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function exportCsv(sessionId: string, sessionTitle: string) {
  const { data: attendanceRows, error } = await supabase.from("attendance_records")
    .select("scanned_at, user_id, guest_member_id")
    .eq("session_id", sessionId).order("scanned_at");
  if (error) { toast.error(error.message); return; }
  if (!attendanceRows || attendanceRows.length === 0) { toast.error("No records to export."); return; }

  const userIds = attendanceRows.filter((r: any) => r.user_id).map((r: any) => r.user_id);
  const guestIds = attendanceRows.filter((r: any) => r.guest_member_id).map((r: any) => r.guest_member_id);

  const [profilesRes, guestsRes] = await Promise.all([
    userIds.length > 0 ? supabase.from("profiles").select("id, name, email").in("id", userIds) : Promise.resolve({ data: [] }),
    guestIds.length > 0 ? supabase.from("guest_members").select("id, name, phone").in("id", guestIds) : Promise.resolve({ data: [] }),
  ]);

  const profileMap: Record<string, any> = {};
  (profilesRes.data ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  const guestMap: Record<string, any> = {};
  (guestsRes.data ?? []).forEach((g: any) => { guestMap[g.id] = g; });

  const data = attendanceRows.map((r: any) => ({
    ...r,
    profiles: r.user_id ? profileMap[r.user_id] ?? null : null,
    guest_members: r.guest_member_id ? guestMap[r.guest_member_id] ?? null : null,
  }));

  const rows = [["#","Name","Contact","Type","Checked In"]];
  data.forEach((r: any, i: number) => {
    const isGuest = !r.user_id;
    rows.push([String(i+1), isGuest ? r.guest_members?.name ?? "" : r.profiles?.name ?? "", isGuest ? r.guest_members?.phone ?? "" : r.profiles?.email ?? "", isGuest ? "Guest" : "Member", format(new Date(r.scanned_at), "yyyy-MM-dd HH:mm:ss")]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `${sessionTitle.replace(/\s+/g,"-")}-attendance.csv`;
  a.click();
  toast.success("CSV exported");
}
