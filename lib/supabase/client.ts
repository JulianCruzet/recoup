import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/** Supabase in the browser: the session lives in cookies, so the proxy sees the same sign-in. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
