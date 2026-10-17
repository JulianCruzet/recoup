"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PUBLIC_PAGES } from "@/components/NavLinks";
import { Icon } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { useSignedIn } from "@/lib/supabase/use-signed-in";

const SPRING = { type: "spring", bounce: 0.18, duration: 0.5 } as const;

/**
 * The right end of the nav: "Open Recoup" for visitors, sign out for staff. Only decides what to show;
 * the proxy is what actually protects pages.
 */
export function NavAction({ cta }: { cta: boolean }) {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  // The landing page always invites people in (signed-in staff are sent straight on to their clients).
  if (cta) return <NavActionView kind="open" />;
  // Off the public pages the proxy already checked the sign-in, so there's nothing to wait for. On a public
  // page, "Open Recoup" stays up while the session is checked and morphs into sign out if it turns out you're in.
  const staff = !PUBLIC_PAGES.has(pathname) || signedIn === true;
  return <NavActionView kind={staff ? "signOut" : "open"} />;
}

/**
 * The black pill itself. Both versions share one layoutId, so going from the landing page into the app
 * the "Open Recoup" pill shrinks into the sign-out circle (and grows back on sign-out).
 */
export function NavActionView({ kind }: { kind: "open" | "signOut" }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    // Drop any signed-in pages the router kept, so Back can't show client data.
    router.refresh();
  }

  return (
    // Radius set as a style so Motion keeps it round while the size animates.
    <motion.div layoutId="nav-action" transition={SPRING} style={{ borderRadius: 999 }} className="ml-1 overflow-hidden bg-night text-white">
      {kind === "open" ? (
        <Link href="/login" className="block px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white/10">
          <motion.span layout="position" className="block">
            <span className="sm:hidden">Sign in</span>
            <span className="hidden sm:inline">Open Recoup</span>
          </motion.span>
        </Link>
      ) : (
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-9 place-items-center transition-colors hover:bg-white/15">
          <motion.span layout="position" className="grid place-items-center">
            <Icon paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]} className="size-[18px]" />
          </motion.span>
        </button>
      )}
    </motion.div>
  );
}
