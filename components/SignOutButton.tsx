"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/config";

/**
 * The end of the in-app nav: sign out for staff, "Open Recoup" for visitors on public pages like /trust.
 * Only decides what to show; the proxy is what actually protects pages.
 */
export function SignOutButton() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    // Fires once with the current session, then again on every sign-in or sign-out.
    const { data } = createClient().auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    // Drop any signed-in pages the router kept, so Back can't show client data.
    router.refresh();
  }

  // Hold the space until the session is known, so the pill doesn't jump.
  if (signedIn === null && supabaseConfigured) return <span aria-hidden className="ml-1 size-9" />;

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="ml-2 rounded-full bg-night px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-transform hover:scale-[1.03]"
      >
        <span className="sm:hidden">Sign in</span>
        <span className="hidden sm:inline">Open Recoup</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={signOut}
      aria-label="Sign out"
      title="Sign out"
      className="ml-1 grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white/50 hover:text-ink"
    >
      <Icon paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]} className="size-5" />
    </button>
  );
}
