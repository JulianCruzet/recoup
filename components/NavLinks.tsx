"use client";

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
const PUBLIC_PAGES = new Set(["/", "/trust", "/login"]);

/** The nav's links: all of them for signed-in staff, only "How it decides" for visitors. */
export function NavLinks({ cta }: { cta: boolean }) {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  // Off the public pages the proxy already checked the sign-in, so show everything without waiting.
  const staff = !PUBLIC_PAGES.has(pathname) || signedIn === true;
  return <LinkList cta={cta} staff={staff} />;
}

/**
 * The links themselves. AppNav also renders this as NavLinks' Suspense fallback: on pages with a dynamic
 * param (like /clients/[id]) the pathname isn't known while the static shell is built.
 */
export function LinkList({ cta, staff }: { cta: boolean; staff: boolean }) {
  return (
    <ul className="flex items-center text-sm font-medium">
      {LINKS.filter((l) => staff || l.public).map((l) => (
        // On the landing page the call to action takes the room on phones; inside the app the links do.
        <li key={l.href} className={cta ? "hidden sm:block" : undefined}>
          <Link href={l.href} className="block rounded-full px-2 py-2 text-ink-soft transition-colors hover:bg-white/50 hover:text-ink sm:px-3.5">
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
