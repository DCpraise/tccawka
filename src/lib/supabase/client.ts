import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Single stable instance — no Proxy, no lazy init, no risk of multiple instances
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      storageKey: "tcc-auth",
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Let Supabase use its default storage (localStorage in browser, memory in SSR)
      // Do NOT explicitly pass window.localStorage — it breaks SSR and causes race conditions
    },
  }
);
