"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, XCircle, AlertTriangle, Download, Search, Loader2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { EVOLVE, type EvolveCategory } from "@/lib/evolve-config";
import type { Database } from "@/lib/supabase/types";

type Reg = Database["public"]["Tables"]["evolve_registrations"]["Row"];
type Result =
  | { kind: "ok"; reg: Reg }
  | { kind: "already"; reg: Reg; at: string }
  | { kind: "unpaid"; reg: Reg }
  | { kind: "notfound"; code: string };

const lagosToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function EvolveAdminPage() {
  const { user, isStaff, isAdmin } = useAuth();
  const allowed = isStaff || isAdmin;

  const [regs, setRegs] = useState<Reg[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(() => (EVOLVE.days.some((d) => d.date === lagosToday()) ? lagosToday() : EVOLVE.days[0].date));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | EvolveCategory>("all");
  const [pay, setPay] = useState<"all" | "paid" | "pending" | "free">("all");
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    const [r, c] = await Promise.all([
      supabase.from("evolve_registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("evolve_checkins").select("registration_id").eq("event_day", day),
    ]);
    if (r.error) toast.error("Could not load registrations");
    setRegs(r.data ?? []);
    setChecked(new Set((c.data ?? []).map((x) => x.registration_id)));
    setLoading(false);
  }, [day]);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const checkIn = useCallback(async (raw: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const code = raw.trim().toUpperCase();
      const { data: reg } = await supabase.from("evolve_registrations").select("*").eq("ticket_code", code).maybeSingle();
      if (!reg) return setResult({ kind: "notfound", code });
      if (reg.payment_status === "pending") return setResult({ kind: "unpaid", reg });

      const { error } = await supabase.from("evolve_checkins").insert({ registration_id: reg.id, event_day: day, checked_in_by: user?.id ?? null });
      if (error?.code === "23505") {
        const { data: prev } = await supabase.from("evolve_checkins").select("checked_in_at").eq("registration_id", reg.id).eq("event_day", day).maybeSingle();
        return setResult({ kind: "already", reg, at: prev?.checked_in_at ?? "" });
      }
      if (error) return toast.error("Could not record check-in");
      setResult({ kind: "ok", reg });
      setChecked((s) => new Set(s).add(reg.id));
    } finally {
      busyRef.current = false;
    }
  }, [day, user?.id]);

  const stopCamera = useCallback(async () => {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = async () => {
    setResult(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("evolve-qr-reader");
      scannerRef.current = scanner;
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 }, async (decoded: string) => {
        await stopCamera();
        checkIn(decoded);
      }, () => {});
    } catch {
      setScanning(false);
      toast.error("Could not start the camera. Use the manual code box instead.");
    }
  };

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  const markPaid = async (r: Reg) => {
    if (!confirm(`Mark ${r.full_name} as paid (cash/transfer received)?`)) return;
    const { error } = await supabase.from("evolve_registrations").update({
      payment_status: "paid", amount_paid: EVOLVE.fees[r.category] || null, payment_reference: `MANUAL-${r.ticket_code}`, paid_at: new Date().toISOString(),
    }).eq("id", r.id);
    if (error) return toast.error("Could not update");
    toast.success("Marked as paid");
    load();
  };

  const stats = useMemo(() => ({
    total: regs.length,
    members: regs.filter((r) => r.category === "member").length,
    workers: regs.filter((r) => r.category === "worker").length,
    statePastors: regs.filter((r) => r.category === "state_pastor").length,
    campusPastors: regs.filter((r) => r.category === "campus_pastor").length,
    paid: regs.filter((r) => r.payment_status === "paid").length,
    pending: regs.filter((r) => r.payment_status === "pending").length,
    checkedToday: checked.size,
  }), [regs, checked]);

  const rows = useMemo(() => regs.filter((r) =>
    (cat === "all" || r.category === cat) && (pay === "all" || r.payment_status === pay) &&
    (!q || `${r.full_name} ${r.email} ${r.phone ?? ""} ${r.ticket_code}`.toLowerCase().includes(q.toLowerCase()))
  ), [regs, q, cat, pay]);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Name", "Email", "Phone", "Category", "Payment", "Amount", "Reference", "Ticket", `Checked in ${day}`, "Registered"];
    const lines = rows.map((r) => [r.full_name, r.email, r.phone, r.category, r.payment_status, r.amount_paid, r.payment_reference, r.ticket_code, checked.has(r.id) ? "Yes" : "No", r.created_at]);
    const csv = [head, ...lines].map((l) => l.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "evolve-registrations.csv"; a.click();
  };

  if (!allowed) return <div className="py-20 text-center text-muted-foreground">Staff access only.</div>;

  const card = "glass rounded-2xl p-4";
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Evolve</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registrations, payments and daily check-in.</p>
        </div>
        <label className="text-sm">
          <span className="mr-2 text-muted-foreground">Check-in day</span>
          <select value={day} onChange={(e) => { setDay(e.target.value); setResult(null); }} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            {EVOLVE.days.map((d) => <option key={d.date} value={d.date}>{d.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Registered", stats.total], ["Checked in today", stats.checkedToday], ["Paid", stats.paid], ["Awaiting payment", stats.pending],
          ["Members", stats.members], ["Workers", stats.workers], ["State pastors", stats.statePastors], ["Satellite / campus pastors", stats.campusPastors],
        ].map(([l, v]) => (
          <div key={l as string} className={card}><div className="text-2xl font-bold">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
        ))}
      </div>

      {/* Check-in */}
      <div className="glass rounded-3xl p-6">
        <h2 className="text-lg font-semibold">Check-in · {EVOLVE.days.find((d) => d.date === day)?.label}</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <div id="evolve-qr-reader" className="overflow-hidden rounded-2xl bg-black" style={{ minHeight: scanning ? 260 : 0 }} />
            {!scanning ? (
              <button onClick={startCamera} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30">
                <Camera className="h-4 w-4" /> Scan ticket QR
              </button>
            ) : (
              <button onClick={stopCamera} className="mt-3 rounded-full border border-border px-5 py-2 text-sm">Stop camera</button>
            )}
            <form onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { checkIn(manual); setManual(""); } }} className="mt-4 flex gap-2">
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type ticket code" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase" />
              <button className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Check in</button>
            </form>
          </div>

          <div className="grid place-items-center rounded-2xl border border-dashed border-border p-6 text-center">
            {!result && <p className="text-sm text-muted-foreground">Scan a ticket to see the result here.</p>}
            {result?.kind === "ok" && (<div><CheckCircle2 className="mx-auto h-14 w-14 text-green-500" /><div className="mt-2 text-xl font-bold">{result.reg.full_name}</div>
              <div className="mt-1 text-sm capitalize text-muted-foreground">{EVOLVE.categoryLabels[result.reg.category]} · {result.reg.payment_status === "paid" ? "PAID" : "FREE"}</div>
              <div className="mt-2 text-sm font-medium text-green-600">Checked in ✓</div></div>)}
            {result?.kind === "already" && (<div><AlertTriangle className="mx-auto h-14 w-14 text-amber-500" /><div className="mt-2 text-xl font-bold">{result.reg.full_name}</div>
              <div className="mt-2 text-sm font-medium text-amber-600">Already checked in today{result.at ? ` at ${new Date(result.at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" })}` : ""}</div></div>)}
            {result?.kind === "unpaid" && (<div><XCircle className="mx-auto h-14 w-14 text-red-500" /><div className="mt-2 text-xl font-bold">{result.reg.full_name}</div>
              <div className="mt-1 text-sm capitalize text-muted-foreground">{EVOLVE.categoryLabels[result.reg.category]}</div>
              <div className="mt-2 text-sm font-medium text-red-600">NOT PAID. Do not admit until paid.</div>
              <button onClick={() => markPaid(result.reg)} className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Mark as paid (cash/transfer)</button></div>)}
            {result?.kind === "notfound" && (<div><XCircle className="mx-auto h-14 w-14 text-red-500" /><div className="mt-2 text-lg font-bold">Ticket not found</div>
              <div className="mt-1 text-sm text-muted-foreground">{result.code}</div></div>)}
          </div>
        </div>
      </div>

      {/* Registrants */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5" /> Registrants ({rows.length})</h2>
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, ticket" className="rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm" /></div>
          <select value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All categories</option><option value="member">Members</option><option value="worker">Workers</option><option value="state_pastor">State pastors</option><option value="campus_pastor">Satellite / campus pastors</option></select>
          <select value={pay} onChange={(e) => setPay(e.target.value as typeof pay)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            <option value="all">All payments</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="free">Free</option></select>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-card"><Download className="h-4 w-4" /> CSV</button>
        </div>

        {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="glass mt-4 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr>
                {["Name", "Contact", "Category", "Payment", "Ticket", "Today", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.email}<br />{r.phone}</td>
                    <td className="px-4 py-3">{EVOLVE.categoryLabels[r.category]}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.payment_status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {r.payment_status}{r.amount_paid ? ` · ${naira(r.amount_paid)}` : ""}</span></td>
                    <td className="px-4 py-3 font-mono text-xs">{r.ticket_code}</td>
                    <td className="px-4 py-3">{checked.has(r.id) ? "✓" : "–"}</td>
                    <td className="px-4 py-3 text-right">{r.payment_status === "pending" && <button onClick={() => markPaid(r)} className="text-xs font-medium text-primary hover:underline">Mark paid</button>}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No registrations match.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
