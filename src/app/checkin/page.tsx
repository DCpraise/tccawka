"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Crown, User, Phone, MapPin, Home, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

let _db: ReturnType<typeof createClient<Database>> | null = null;
function db() {
  if (!_db) _db = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _db;
}

const MEMBER_KEY = "tcc_member_id";
type Stage = "verifying"|"returning"|"register"|"submitting"|"success"|"already"|"expired"|"invalid"|"error";
type Session = { id: string; title: string; expires_at: string };

function CheckInInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [stage, setStage] = useState<Stage>("verifying");
  const [session, setSession] = useState<Session | null>(null);
  const [memberName, setMemberName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [lodge, setLodge] = useState("");

  const markAttendance = useCallback(async (memberId: string, sess: Session, displayName: string) => {
    setStage("returning");
    setMemberName(displayName);
    const { error } = await (db().from("attendance_records") as any).insert({
      session_id: sess.id, guest_member_id: memberId, user_id: null,
      device_info: navigator.userAgent.slice(0, 200),
    });
    if (error) {
      if (error.code === "23505" || error.message?.includes("unique")) { setStage("already"); }
      else { setErrorMsg(error.message); setStage("error"); }
      return;
    }
    setStage("success");
  }, []);

  useEffect(() => {
    if (!token) { setStage("invalid"); return; }
    (async () => {
      const { data: sess, error } = await db().from("attendance_sessions")
        .select("id, title, expires_at").eq("qr_token", token).maybeSingle();
      if (error || !sess) { setStage("invalid"); return; }
      const s = sess as Session;
      if (new Date(s.expires_at) < new Date()) { setStage("expired"); return; }
      setSession(s);
      const savedId = localStorage.getItem(MEMBER_KEY);
      if (savedId) {
        const { data: member } = await db().from("guest_members")
          .select("id, name").eq("id", savedId).maybeSingle();
        if (member) {
          const m = member as { id: string; name: string };
          await markAttendance(m.id, s, m.name);
          return;
        }
        localStorage.removeItem(MEMBER_KEY);
      }
      setStage("register");
    })();
  }, [token, markAttendance]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setStage("submitting");
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const { data: existing } = await db().from("guest_members")
      .select("id, name").eq("phone", cleanPhone).maybeSingle();
    if (existing) {
      const m = existing as { id: string; name: string };
      localStorage.setItem(MEMBER_KEY, m.id);
      await markAttendance(m.id, session, m.name);
      return;
    }
    const { data: newMember, error: insertErr } = await (db().from("guest_members") as any)
      .insert({ name: name.trim(), phone: cleanPhone, location: location.trim(), lodge: lodge.trim() || null })
      .select("id").single();
    if (insertErr || !newMember) { setErrorMsg(insertErr?.message ?? "Registration failed"); setStage("error"); return; }
    const m = newMember as { id: string };
    localStorage.setItem(MEMBER_KEY, m.id);
    setMemberName(name.trim());
    await markAttendance(m.id, session, name.trim());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
          <Crown className="h-6 w-6" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold">TCC</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">The Crowned Church</div>
        </div>
      </div>

      {(stage === "verifying" || stage === "returning") && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{stage === "verifying" ? "Verifying session…" : `Welcome back, ${memberName}! Marking attendance…`}</p>
        </div>
      )}

      {stage === "register" && (
        <div className="glass w-full max-w-sm rounded-3xl p-8">
          <div className="mb-6 text-center">
            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">{session?.title}</div>
            <h1 className="mt-3 text-2xl font-bold">Welcome! 👋</h1>
            <p className="mt-1 text-sm text-muted-foreground">Fill in your details once. Next scan is instant.</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-3">
            <Field icon={User} label="Full name" type="text" value={name} onChange={setName} placeholder="e.g. Praise Chukwu" required />
            <Field icon={Phone} label="Phone number" type="tel" value={phone} onChange={setPhone} placeholder="e.g. 08012345678" required />
            <Field icon={MapPin} label="Location / Junction" type="text" value={location} onChange={setLocation} placeholder="e.g. Ogui Road" required />
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Lodge <span className="font-normal opacity-60">(optional)</span></span>
              <div className="relative">
                <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={lodge} onChange={e => setLodge(e.target.value)} placeholder="e.g. Unity Lodge"
                  className="w-full rounded-xl border border-border bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </label>
            <button type="submit" className="mt-2 w-full rounded-2xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95">
              Mark my attendance ✓
            </button>
          </form>
        </div>
      )}

      {stage === "submitting" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Recording your attendance…</p>
        </div>
      )}

      {stage === "success" && (
        <div className="glass w-full max-w-sm rounded-3xl p-10 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h2 className="mt-5 text-3xl font-bold">You&apos;re in! 🎉</h2>
          <p className="mt-2 text-lg text-muted-foreground">Welcome, <span className="font-semibold text-foreground">{memberName}</span>!</p>
          <div className="mt-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">{session?.title}</div>
          <p className="mt-6 text-sm text-muted-foreground">Your attendance has been recorded. God bless you! 🙏</p>
        </div>
      )}

      {stage === "already" && (
        <div className="glass w-full max-w-sm rounded-3xl p-10 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-12 w-12" /></div>
          <h2 className="mt-5 text-2xl font-bold">Already checked in ✓</h2>
          <p className="mt-2 text-muted-foreground">{memberName}, you&apos;ve already been marked for this session.</p>
          <div className="mt-3 inline-block rounded-full bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">{session?.title}</div>
        </div>
      )}

      {stage === "expired" && (
        <div className="glass w-full max-w-sm rounded-3xl p-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-muted text-muted-foreground"><XCircle className="h-10 w-10" /></div>
          <h2 className="mt-5 text-2xl font-bold">Session expired</h2>
          <p className="mt-2 text-sm text-muted-foreground">This QR code is no longer active. Ask your usher to generate a new one.</p>
        </div>
      )}

      {(stage === "invalid" || stage === "error") && (
        <div className="glass w-full max-w-sm rounded-3xl p-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive"><XCircle className="h-10 w-10" /></div>
          <h2 className="mt-5 text-2xl font-bold">{stage === "invalid" ? "Invalid QR code" : "Something went wrong"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{stage === "invalid" ? "This link doesn't match any session." : errorMsg}</p>
          {stage === "error" && (
            <button onClick={() => setStage("register")} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Try again</button>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, type, value, onChange, placeholder, required }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full rounded-xl border border-border bg-background/60 py-3 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>
    </label>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <CheckInInner />
    </Suspense>
  );
}
