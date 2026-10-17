"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
 * between pages it slides from the old link to the new one instead of jumping.
 */
export function LinkList({ cta, staff, pathname }: { cta: boolean; staff: boolean; pathname?: string }) {
  const isCurrent = (href: string) => pathname === href || Boolean(pathname?.startsWith(`${href}/`));
  return (
    <ul className="flex items-center text-sm font-medium">
      {LINKS.filter((l) => staff || l.public).map((l) => {
        const current = isCurrent(l.href);
        return (
          // On the landing page the call to action takes the room on phones; inside the app the links do.
          <li key={l.href} className={cta ? "hidden sm:block" : undefined}>
            <Link
              href={l.href}
              aria-current={current ? "page" : undefined}
              className={`relative isolate block rounded-full px-2 py-2 transition-colors sm:px-3.5 ${current ? "text-ink" : "text-ink-soft hover:bg-white/50 hover:text-ink"}`}
            >
              {current && (
                <motion.span
                  layoutId="nav-current"
                  // Arriving from a page with no pill (like the landing page) it grows in; between pages it slides.
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                  style={{ borderRadius: 999 }}
                  className="absolute inset-0 -z-10 bg-white/85 shadow-[0_2px_10px_-4px_rgb(29_31_33/0.35)]"
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
