import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";

// Anyone can read these; everything else (clients, tracker, dashboard, APIs, server actions) needs a staff sign-in.
const PUBLIC = new Set(["/", "/trust", "/login"]);

/** Refreshes the Supabase session on every request and keeps signed-out visitors out of the app. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC.has(pathname);

  // Without keys nobody can sign in, so fail closed rather than leave client data open.
  if (!supabaseConfigured) return isPublic ? NextResponse.next() : signIn(request);

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims verifies the token's signature; a cookie alone is not proof of a sign-in.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  if (pathname === "/login" && signedIn) return withCookies(NextResponse.redirect(new URL("/clients", request.url)), response);
  if (isPublic || signedIn) return response;
  return withCookies(signIn(request), response);
}

function signIn(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to use Recoup." }, { status: 401 });
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

/** A redirect still has to carry any refreshed session cookies. */
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export const config = {
  // Only real static file types skip the check: a catch-all "anything with a dot" would also skip page data (.rsc)
  // and dotted paths like /clients/x.y that still reach pages and server actions.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpe?g|webp|gif|ico|txt|xml|woff2?)$).*)"],
};
