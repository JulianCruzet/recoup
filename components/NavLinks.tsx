"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSignedIn } from "@/lib/supabase/use-signed-in";

// Short labels fit a phone-width pill. Visitors only see the public page.
const LINKS = [
  { href: "/clients", label: "Clients", short: "Clients", public: false },
  { href: "/tracker", label: "Applications", short: "Apps", public: false },
  { href: "/dashboard", label: "Dashboard", short: "Totals", public: false },
  { href: "/trust", label: "How it decides", short: "Rules", public: true },
];
// Pages anyone can open (the proxy's list); every other page means a staff member is signed in.
export const PUBLIC_PAGES = new Set(["/", "/trust", "/login"]);

/** The nav's links: all of them for signed-in staff, only "How it decides" for visitors. */
export function NavLinks({ cta }: { cta: boolean }) {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  // Off the public pages the proxy already checked the sign-in, so show everything without waiting.
  const staff = !PUBLIC_PAGES.has(pathname) || signedIn === true;
  return <LinkList cta={cta} staff={staff} pathname={pathname} />;
}

/**
 * The links themselves. AppNav also renders this as NavLinks' Suspense fallback: on pages with a dynamic
 * param (like /clients/[id]) the pathname isn't known while the static shell is built.
 *
 * The page you're on gets a white pill behind its link. It's one shared element (a layoutId), so moving
 * between pages it slides from the old link to the new one instead of jumping. It moves the moment you
 * click, while the next page is still loading, rather than when that page arrives and the browser is
 * busiest; once the address changes, the address decides again.
 */
export function LinkList({ cta, staff, pathname }: { cta: boolean; staff: boolean; pathname?: string }) {
  const [clicked, setClicked] = useState<{ href: string; from?: string } | null>(null);
  const target = clicked && clicked.from === pathname ? clicked.href : null;
  const isCurrent = (href: string) => (target ? target === href : pathname === href || Boolean(pathname?.startsWith(`${href}/`)));
  return (
    <ul className="flex items-center text-sm font-medium">
      {LINKS.filter((l) => staff || l.public).map((l) => {
        // No pill on the landing page's nav; in the app it marks the page you're on.
        const current = !cta && isCurrent(l.href);
        return (
          // On the landing page the call to action takes the room on phones; inside the app the links do.
          <li key={l.href} className={cta ? "hidden sm:block" : undefined}>
            <Link
              href={l.href}
              onClick={(e) => {
                // A plain click navigates here; one that opens a new tab or window doesn't move the pill.
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) setClicked({ href: l.href, from: pathname });
              }}
              aria-current={current ? "page" : undefined}
              className={`relative isolate block rounded-full px-2 py-2 transition-colors sm:px-3.5 ${current ? "text-ink" : "text-ink-soft hover:bg-white/50 hover:text-ink"}`}
            >
              {current && (
                <motion.span
                  layoutId="nav-current"
                  layoutDependency={target ?? pathname}
                  // Arriving from a page with no pill (like the landing page) it grows in; between pages it slides.
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  // Its own compositor layer, so sliding it doesn't make the nav's glass redraw every frame.
                  style={{ borderRadius: 999, willChange: "transform" }}
                  className="absolute inset-0 -z-10 bg-white/85"
                />
              )}
              <span className="sm:hidden">{l.short}</span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
