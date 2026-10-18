import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LiquidGlass } from "@/components/glass/LiquidGlass";
import { Logo } from "@/components/ui/Logo";
import { supabaseConfigured } from "@/lib/supabase/config";
import { DemoLogin } from "./DemoLogin";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · Recoup" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col px-4 py-16 text-ink sm:px-6">
      {/* The demo account sits beside the form on wide screens and below it on phones. */}
      <div className="mx-auto my-auto flex w-full max-w-md flex-col gap-5 lg:max-w-[50rem] lg:flex-row lg:items-center">
        <LiquidGlass tint="frost" radius={30} bezel={26} strength={48} className="w-full p-7 sm:p-9 lg:max-w-md">
          <Link href="/" className="inline-flex text-xl" aria-label="Recoup home">
            <Logo size={30} />
          </Link>
          <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight">Staff sign in</h1>
          <p className="mt-1 text-ink-soft">For community centre and tax clinic staff. Clients never need an account.</p>
          {supabaseConfigured ? (
            // The form reads ?next= from the URL, which needs its own boundary.
            <Suspense>
              <LoginForm />
            </Suspense>
          ) : (
            <p role="alert" className="mt-6 rounded-2xl bg-white/80 p-4 text-sm">
              Sign-in isn&rsquo;t set up on this copy of Recoup yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env.local</code> and restart the server.
            </p>
          )}
        </LiquidGlass>
        {supabaseConfigured && <DemoLogin />}
      </div>
    </main>
  );
}
