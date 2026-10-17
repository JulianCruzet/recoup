"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";

/** Ends the staff session and goes back to the public landing page. */
export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    // Drop any signed-in pages the router kept, so Back can't show client data.
    router.refresh();
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
