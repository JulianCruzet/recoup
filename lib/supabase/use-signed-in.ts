"use client";

import { useEffect, useState } from "react";
import { createClient } from "./client";
import { supabaseConfigured } from "./config";

/** Whether a staff member is signed in: null until the session is known, then live on sign-in/out. */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!supabaseConfigured) return;
    // Fires once with the current session, then again on every sign-in or sign-out.
    const { data } = createClient().auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  return supabaseConfigured ? signedIn : false;
}
