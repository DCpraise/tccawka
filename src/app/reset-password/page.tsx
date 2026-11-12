"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Lock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type Status = "loading" | "form" | "success" | "invalid";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setStatus("form");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus("form");
      else setTimeout(() => setStatus(s => s === "loading" ? "invalid" : s), 2000);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("success");
      toast.success("Password updated!");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
            <Crown className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold">TCC</span>
        </div>

        {status === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">Verifying reset link…</p>}

        {status === "form" && (
          <>
            <h1 className="text-3xl font-bold">Set new password</h1>
            <form onSubmit={submit} className="mt-6 space-y-4">
              {[{ label: "New password", val: password, set: setPassword }, { label: "Confirm password", val: confirm, set: setConfirm }].map(f => (
                <label key={f.label} className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{f.label}</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="password" value={f.val} onChange={e => f.set(e.target.value)} required minLength={6}
                      className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </label>
              ))}
              <button type="submit" disabled={submitting}
                className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {submitting ? "Updating…" : "Set new password"}
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-8 w-8" /></div>
            <h2 className="mt-4 text-2xl font-bold">Password updated!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Redirecting…</p>
          </div>
        )}

        {status === "invalid" && (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive"><XCircle className="h-8 w-8" /></div>
            <h2 className="mt-4 text-2xl font-bold">Link expired</h2>
            <button onClick={() => router.push("/auth")} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Request new link</button>
          </div>
        )}
      </div>
    </div>
  );
}
