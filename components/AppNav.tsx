import Link from "next/link";
import { LiquidGlass } from "@/components/glass/LiquidGlass";

const LINKS = [
  { href: "/clients", label: "Clients" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trust", label: "How it decides" },
];

/** A floating glass pill, centred at the top of every page. */
export function AppNav({ cta = true }: { cta?: boolean }) {
  return (
    <div className="sticky top-4 z-20 flex justify-center px-4">
      <LiquidGlass
        as="nav"
        radius={999}
        bezel={20}
        strength={40}
        className="flex items-center gap-1 py-1.5 pr-1.5 pl-5 text-ink"
      >
        <Link href="/" className="font-display mr-3 text-lg font-extrabold tracking-tight">
          Recoup
        </Link>
        <ul className="flex items-center text-sm font-medium">
          {LINKS.map((l) => (
            <li key={l.href} className="hidden sm:block">
              <Link href={l.href} className="rounded-full px-3.5 py-2 text-ink-soft transition-colors hover:bg-white/50 hover:text-ink">
                {l.label}
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
