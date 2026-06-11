// Server-only Supabase client. NIEMALS in einer Datei mit "use client" importieren.
// Verwendet den Service-Role-Key, der RLS bypasst.
//
// Nicht im Modul-Scope instanziieren — sonst crasht es beim Build wenn die
// Env-Var nicht gesetzt ist. Statt­dessen pro Request lazy initialisieren
// (Vercel-Cold-Starts sind so schnell, dass das vernachlässigbar ist).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen in der Env gesetzt sein."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
