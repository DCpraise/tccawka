"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot" | "forgot-sent";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { name } },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created! Welcome.");
          router.replace("/dashboard");
          return; // don't setLoading(false) — page is navigating away
        } else {
          toast.success("Check your email to confirm your account.");
          setMode("login");
        }
      } else if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome back!");
          router.replace("/dashboard");
          return; // don't setLoading(false) — page is navigating away
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMode("forgot-sent");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Something went wrong";
      if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        toast.error("Wrong email or password.");
      } else if (msg.includes("rate") || msg.includes("429")) {
        toast.error("Too many attempts — wait a few minutes.");
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Please confirm your email first.");
      } else {
        toast.error(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
            <Crown className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold">TCC</span>
        </Link>

        {mode === "login" && (
          <>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage attendance.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required />
              <div>
                <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
                <button type="button" onClick={() => setMode("forgot")} className="mt-1.5 text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <Btn loading={loading} label="Sign in" />
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">No account? <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">Sign up</button></p>
          </>
        )}

        {mode === "signup" && (
          <>
            <h1 className="text-3xl font-bold">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join TCC attendance.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field icon={UserIcon} label="Name" type="text" value={name} onChange={setName} required />
              <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required />
              <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
              <Btn loading={loading} label="Create account" />
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">Already have one? <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">Sign in</button></p>
          </>
        )}

        {mode === "forgot" && (
          <>
            <button onClick={() => setMode("login")} className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
            <h1 className="text-3xl font-bold">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">We&apos;ll send you a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required />
              <Btn loading={loading} label="Send reset link" />
            </form>
          </>
        )}

        {mode === "forgot-sent" && (
          <div className="py-4 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">Reset link sent to <span className="font-medium text-foreground">{email}</span>.</p>
            <button onClick={() => setMode("login")} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Back to sign in</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 disabled:opacity-50">
      {loading ? "Please wait…" : label}
    </button>
  );
}

function Field({ icon: Icon, label, type, value, onChange, required, minLength }: any) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)}
          required={required} minLength={minLength}
          className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>
    </label>
  );
}
