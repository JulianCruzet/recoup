import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

/**
 * Whether this request comes from a signed-in staff member. Server actions and API routes check this
 * themselves rather than trusting the proxy alone. Fails closed when Supabase isn't configured.
 */
export async function isStaff(): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const store = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(cookiesToSet) {
        // Route handlers and actions can refresh the session cookie; the proxy also does it on every page.
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {}
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}
