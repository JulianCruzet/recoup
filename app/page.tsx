import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LiquidGlass } from "@/components/glass/LiquidGlass";

export default function Landing() {
  return (
    <main className="flex min-h-dvh flex-col px-4 pt-4 text-ink sm:px-6">
      <AppNav />

      <section className="mx-auto mt-[3vh] w-full max-w-6xl">
        <h1 className="font-display max-w-4xl text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl">
          Get people the money they&rsquo;re already owed.
        </h1>
        <p className="mt-3 max-w-xl text-lg font-medium text-ink-soft">
          Finds what a client is likely owed, with the rule behind every dollar. Prepares the forms. Follows each one
          until it&rsquo;s paid.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href="/clients"
            className="rounded-full bg-night px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            See how it works
          </Link>
        </div>
      </section>

      <LiquidGlass
        tint="frost"
        radius={30}
        bezel={26}
        strength={48}
        className="mx-auto mt-auto mb-10 grid w-full max-w-6xl gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-end sm:p-8"
      >
        <div>
          <p className="text-sm font-medium tracking-wide text-ink-soft uppercase">One family, one intake</p>
          <p className="font-display mt-1 text-6xl font-extrabold text-accent-ink sm:text-7xl">$31,107</p>
        </div>
        <p className="max-w-xl text-base text-ink sm:justify-self-end sm:text-right">
          Disability Tax Credit back to 2016 plus the Child Disability Benefit, found for a family that had never applied.
          <span className="mt-1 block text-sm text-ink-soft">Free for clients, never takes a cut. Demo persona; estimates follow published CRA rules.</span>
        </p>
      </LiquidGlass>

      <footer className="mx-auto mb-4 w-full max-w-6xl text-xs text-ink-soft">
        Photo by{" "}
        <a className="underline" href="https://unsplash.com/photos/green-hills-and-a-beautiful-blue-sky-Kn1eMkcZ1BU">
          Jimmy Liu
        </a>{" "}
        on Unsplash
      </footer>
    </main>
  );
}
