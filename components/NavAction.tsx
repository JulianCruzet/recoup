"use client";

import { motion, useAnimate } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
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

const MORPH_KEY = "recoup:open-morph";

/**
 * The black pill itself: "Open Recoup", or the sign-out circle. Arriving in the app from the landing
 * page's "Open Recoup", the circle starts out as that pill and shrinks into place, so it reads as one
 * button changing. The landing nav and the in-app nav are separate (see AppNav), so this is played
 * here on arrival rather than as a shared-element animation across the page swap.
 */
export function NavActionView({ kind }: { kind: "open" | "signOut" }) {
  const router = useRouter();
  const [scope, animate] = useAnimate();

  useLayoutEffect(() => {
    if (kind !== "signOut") return;
    let arrived = false;
    try {
      arrived = sessionStorage.getItem(MORPH_KEY) === "1";
      sessionStorage.removeItem(MORPH_KEY);
    } catch {}
    if (!arrived || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Before the first paint: start as the pill, then shrink to the circle while the label gives way to the icon.
    animate(scope.current, { width: [124, 36] }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
    animate("[data-morph=label]", { opacity: [1, 0] }, { duration: 0.2 });
    animate("[data-morph=icon]", { opacity: [0, 1] }, { duration: 0.25, delay: 0.25 });
  }, [kind, animate, scope]);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    // Drop any signed-in pages the router kept, so Back can't show client data.
    router.refresh();
  }

  const rememberMorph = () => {
    try {
      sessionStorage.setItem(MORPH_KEY, "1");
    } catch {}
  };

  return (
    // Radius set as a style so Motion keeps it round when the size changes; it only re-measures when the kind does.
    <motion.div
      ref={scope}
      layoutId="nav-action"
      layoutDependency={kind}
      transition={SPRING}
      style={{ borderRadius: 999 }}
      className="relative ml-1 overflow-hidden bg-night text-white"
    >
      {kind === "open" ? (
        <Link href="/login" onClick={rememberMorph} className="block px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-white/10">
          <span className="sm:hidden">Sign in</span>
          <span className="hidden sm:inline">Open Recoup</span>
        </Link>
      ) : (
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-9 place-items-center transition-colors hover:bg-white/15">
          <span data-morph="label" aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold whitespace-nowrap opacity-0">
            Open Recoup
          </span>
          <span data-morph="icon" className="grid place-items-center">
            <Icon paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"]} className="size-[18px]" />
          </span>
        </button>
      )}
    </motion.div>
  );
}
