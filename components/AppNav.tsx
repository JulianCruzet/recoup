import Link from "next/link";
import { LiquidGlass } from "@/components/glass/LiquidGlass";

// Short labels fit a phone-width pill.
const LINKS = [
  { href: "/clients", label: "Clients", short: "Clients" },
  { href: "/tracker", label: "Applications", short: "Apps" },
  { href: "/dashboard", label: "Dashboard", short: "Totals" },
  { href: "/trust", label: "How it decides", short: "Rules" },
];

/** A floating glass pill, centred at the top of every page. */
export function AppNav({ cta = true }: { cta?: boolean }) {
  return (
    <div className="sticky top-4 z-20 flex justify-center px-4 print:hidden">
      <LiquidGlass
        as="nav"
        radius={999}
        bezel={20}
        strength={40}
        className="flex items-center gap-1 py-1.5 pr-1.5 pl-4 text-ink sm:pl-5"
      >
        <Link href="/" className="font-display mr-1 text-lg font-extrabold tracking-tight sm:mr-3">
          Recoup
        </Link>
        <ul className="flex items-center text-sm font-medium">
          {LINKS.map((l) => (
            // On the landing page the call to action takes the room on phones; inside the app the links do.
            <li key={l.href} className={cta ? "hidden sm:block" : undefined}>
              <Link href={l.href} className="block rounded-full px-2.5 py-2 text-ink-soft transition-colors hover:bg-white/50 hover:text-ink sm:px-3.5">
                <span className="sm:hidden">{l.short}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        {cta && (
          <Link
            href="/clients"
            className="ml-2 rounded-full bg-night px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            Open Recoup
          </Link>
        )}
      </LiquidGlass>
    </div>
  );
}
