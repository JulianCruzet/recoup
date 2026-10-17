import Link from "next/link";
import { Suspense } from "react";
import { LiquidGlass } from "@/components/glass/LiquidGlass";
import { LinkList, NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";
import { LogoMark } from "@/components/ui/Logo";

/** A floating glass pill, centred at the top of every page. */
export function AppNav({ cta = true }: { cta?: boolean }) {
  return (
    <div className="sticky top-4 z-20 flex justify-center px-4 print:hidden">
      <LiquidGlass
        as="nav"
        radius={999}
        bezel={20}
        strength={40}
        className="flex items-center gap-1 py-1.5 pr-1.5 pl-1.5 text-ink"
      >
        {/* The mark is a 36px circle, mirroring the round button at the other end of the pill. */}
        <Link href="/" className="mr-1 flex items-center gap-2.5 pr-1 sm:mr-3">
          <LogoMark size={36} round marigold />
          <span className="font-display hidden text-lg leading-none font-extrabold tracking-tight text-accent-ink sm:inline">Recoup</span>
        </Link>
        {/* Inside the app (no call to action) every page behind a dynamic param is staff-only, so the fallback shows all links. */}
        <Suspense fallback={<LinkList cta={cta} staff={!cta} />}>
          <NavLinks cta={cta} />
        </Suspense>
        {/* Signed-in staff skip the form: the proxy sends them from /login straight to their clients. */}
        {cta ? (
          <Link
            href="/login"
            className="ml-2 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Open Recoup
          </Link>
        ) : (
          <SignOutButton />
        )}
      </LiquidGlass>
    </div>
  );
}
