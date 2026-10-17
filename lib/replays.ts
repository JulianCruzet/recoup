import type { Turn } from "@/components/SessionReplay";
import sFamily from "@/seed/transcripts/s-family.json";

/** Recorded intakes the session page can replay, by persona. Only the S. family has one today. */
export const REPLAYS: Record<string, Turn[]> = { "s-family": sFamily as Turn[] };

export const hasReplay = (personaId: string | null | undefined) => Boolean(personaId && REPLAYS[personaId]);
