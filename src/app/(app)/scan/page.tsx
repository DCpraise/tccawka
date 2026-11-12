"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ScanLine, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

function ScanInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle"|"scanning"|"success"|"error">("idle");
  const [message, setMessage] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [memberInfo, setMemberInfo] = useState<{ name: string; member_type: string; fellowship_name: string | null } | null>(null);
  const scannerRef = useRef<any>(null);
  const doneRef = useRef(false);

  const submitToken = async (token: string) => {
    if (doneRef.current || !user) return;
    doneRef.current = true;
    setStatus("scanning");
    setMessage("Verifying…");
    try {
      const { data: sess, error: sErr } = await supabase.from("attendance_sessions")
        .select("id, title, expires_at").eq("qr_token", token).maybeSingle();
      if (sErr || !sess) throw new Error("Invalid QR code");
      const s = sess as any;
      if (new Date(s.expires_at) < new Date()) throw new Error("QR code has expired");
      const { error: iErr } = await (supabase.from("attendance_records") as any).insert({
        user_id: user.id, session_id: s.id, device_info: navigator.userAgent.slice(0, 200),
      });
      if (iErr) {
        if (iErr.code === "23505") throw new Error("Already marked for this session");
        throw iErr;
      }
      setSessionTitle(s.title);

      // Fetch member status + fellowship for display
      const { data: profile } = await supabase.from("profiles").select("name, member_type, fellowships(name)").eq("id", user.id).maybeSingle();
      if (profile) {
        setMemberInfo({ name: (profile as any).name, member_type: (profile as any).member_type, fellowship_name: (profile as any).fellowships?.name ?? null });
      }

      setStatus("success");
      toast.success(`Checked in to ${s.title}`);
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message ?? "Could not record attendance");
      toast.error(e?.message ?? "Error");
      doneRef.current = false;
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && user) submitToken(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const startCamera = async () => {
    setStatus("scanning");
    setMessage("Point at a QR code");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 240 },
        async (decoded: string) => {
          await scanner.stop().catch(() => {});
          let token = decoded;
          try { token = new URL(decoded).searchParams.get("token") ?? decoded; } catch {}
          submitToken(token);
        }, () => {}
      );
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message ?? "Camera error");
    }
  };

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  const reset = () => { doneRef.current = false; setStatus("idle"); setMessage(""); setSessionTitle(""); setMemberInfo(null); };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">Scan QR</h1>
      <p className="mt-1 text-sm text-muted-foreground">Staff scanner — mark your own attendance.</p>
      <div className="glass mt-6 rounded-3xl p-6">
        {status === "success" && (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-8 w-8" /></div>
            <h2 className="mt-4 text-xl font-bold">Checked in ✓</h2>
            <p className="mt-1 text-sm text-muted-foreground">{sessionTitle}</p>
            {memberInfo && (
              <div className="mt-4 inline-flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/40 px-5 py-3">
                <span className="font-medium">{memberInfo.name}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">{memberInfo.member_type.replace("_"," ")}</span>
                  {memberInfo.fellowship_name && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{memberInfo.fellowship_name}</span>}
                </div>
              </div>
            )}
            <button onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Scan another</button>
          </div>
        )}
        {status === "error" && (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive"><XCircle className="h-8 w-8" /></div>
            <h2 className="mt-4 text-xl font-bold">Couldn&apos;t scan</h2>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            <button onClick={reset} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Try again</button>
          </div>
        )}
        {(status === "idle" || status === "scanning") && (
          <>
            <div id="qr-reader" className="overflow-hidden rounded-2xl bg-black" style={{ minHeight: status === "scanning" ? 280 : 0 }} />
            {status === "idle" && (
              <div className="py-8 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><ScanLine className="h-8 w-8" /></div>
                <p className="mt-4 text-sm text-muted-foreground">Ready when you are.</p>
                <button onClick={startCamera} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90">
                  <Camera className="h-4 w-4" /> Start camera
                </button>
              </div>
            )}
            {status === "scanning" && <p className="mt-3 text-center text-xs text-muted-foreground">{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ScanInner />
    </Suspense>
  );
}
