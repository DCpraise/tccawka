"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export type AppRole = "admin" | "staff" | "user" | "fellowship_leader";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
  isFellowshipLeader: boolean;
  fellowshipId: string | null;
}

const Ctx = createContext<AuthCtx>({
  user: null, session: null, roles: [], loading: true,
  signOut: async () => {}, isAdmin: false, isStaff: false,
  isFellowshipLeader: false, fellowshipId: null,
});

const ADMIN_EMAIL = "chukwupraise69@gmail.com";

async function fetchRoles(userId: string, email: string): Promise<{ roles: AppRole[]; fellowshipId: string | null }> {
  try {
    const { data } = await supabase.from("user_roles").select("role, fellowship_id").eq("user_id", userId);
    const roles = (data ?? []).map((r: any) => r.role as AppRole);
    const leaderRow = (data ?? []).find((r: any) => r.role === "fellowship_leader");
    const fellowshipId = leaderRow?.fellowship_id ?? null;
    if (email === ADMIN_EMAIL && !roles.includes("admin")) {
      await supabase.from("user_roles").upsert(
        [{ user_id: userId, role: "admin" as any }, { user_id: userId, role: "staff" as any }],
        { onConflict: "user_id,role" }
      );
      return { roles: [...new Set([...roles, "admin" as AppRole, "staff" as AppRole])], fellowshipId };
    }
    return { roles, fellowshipId };
  } catch {
    return { roles: email === ADMIN_EMAIL ? ["admin", "staff", "user"] : [], fellowshipId: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [fellowshipId, setFellowshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // getSession() reads the stored session from localStorage synchronously-ish.
    // We set user + loading=false immediately from this, so the layout never
    // sees a false "no user" state and bounces to /auth.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false); // Set loading false RIGHT AWAY — don't wait for fetchRoles
      // Fetch roles in background after loading is already false
      if (s?.user) {
        fetchRoles(s.user.id, s.user.email ?? "").then(({ roles: r, fellowshipId: f }) => {
          if (mounted) { setRoles(r); setFellowshipId(f); }
        });
      }
    });

    // onAuthStateChange handles sign-in, sign-out, and token refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        fetchRoles(s.user.id, s.user.email ?? "").then(({ roles: r, fellowshipId: f }) => {
          if (mounted) { setRoles(r); setFellowshipId(f); }
        });
      } else {
        setRoles([]);
        setFellowshipId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = roles.includes("admin") || user?.email === ADMIN_EMAIL;
  const isStaff = isAdmin || roles.includes("staff");
  const isFellowshipLeader = roles.includes("fellowship_leader");

  return (
    <Ctx.Provider value={{
      user, session, roles, loading,
      signOut: async () => { await supabase.auth.signOut(); },
      isAdmin, isStaff, isFellowshipLeader, fellowshipId,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() { return useContext(Ctx); }
