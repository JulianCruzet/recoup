"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

/** Only send people back to a page inside this site, never to another host. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/clients";
}

export function LoginForm() {
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
      setPending(false);
      return;
    }
    // A full load so the proxy and every server component see the new session cookie.
    window.location.assign(next);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="grid gap-1.5 text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-night px-6 py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
