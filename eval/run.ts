// Score fact extraction against the hand-labelled transcripts in eval/transcripts.
// Run: npx tsx --conditions=react-server eval/run.ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extractFacts } from "@/lib/ai/extract";

type Transcript = { id: string; turns: { speaker: string; text: string }[]; expected: Record<string, unknown> };
type Miss = { field: string; expected: unknown; got?: unknown };
type Row = { id: string; expected: number; correct: number; wrong: Miss[]; missed: Miss[]; extra: { field: string; got: unknown; quote?: string }[]; dropped: number };

process.loadEnvFile(".env.local");
const dir = process.argv[2] ?? path.join("eval", "transcripts");

/** Money within 1%, everything else exact. */
function same(field: string, expected: unknown, got: unknown): boolean {
  if (typeof expected === "number" && typeof got === "number") {
    return field.startsWith("money.") ? Math.abs(got - expected) <= Math.max(1, expected * 0.01) : got === expected;
  }
  return expected === got;
}

/** The free Gemini tier allows a few requests a minute; wait it out instead of failing the run. */
async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= tries || !String(err).includes("429")) throw err;
      console.log(`      rate limited, waiting 60s (try ${i} of ${tries})`);
      await new Promise((r) => setTimeout(r, 60_000));
    }
  }
}

async function main() {
  const rows: Row[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const t = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Transcript;
    const text = t.turns.map((x) => `${x.speaker === "staff" ? "Staff" : "Client"}: ${x.text}`).join("\n");
    const { facts, dropped } = await withRetry(() => extractFacts(text));
    const got = new Map(facts.map((f) => [f.field as string, f.value]));

    const wrong: Miss[] = [];
    const missed: Miss[] = [];
    let correct = 0;
    for (const [field, expected] of Object.entries(t.expected)) {
      if (!got.has(field)) missed.push({ field, expected });
      else if (same(field, expected, got.get(field))) correct++;
      else wrong.push({ field, expected, got: got.get(field) });
    }
    const extra = facts.filter((f) => !(f.field in t.expected)).map((f) => ({ field: f.field, got: f.value, quote: f.quote }));

    rows.push({ id: t.id, expected: Object.keys(t.expected).length, correct, wrong, missed, extra, dropped: dropped.length });
    console.log(`${t.id}  ${correct}/${Object.keys(t.expected).length}  wrong ${wrong.length}  missed ${missed.length}  extra ${extra.length}  dropped ${dropped.length}`);
    for (const w of wrong) console.log(`      wrong  ${w.field}: expected ${JSON.stringify(w.expected)}, got ${JSON.stringify(w.got)}`);
    for (const m of missed) console.log(`      missed ${m.field}: ${JSON.stringify(m.expected)}`);
    const troubled = new Set([...wrong, ...missed].map((x) => x.field));
    for (const d of dropped.filter((d) => troubled.has(d.field))) console.log(`      dropped ${d.field} = ${JSON.stringify(d.value)} from "${d.quote}"`);
  }

  const sum = (k: "expected" | "correct" | "dropped") => rows.reduce((n, r) => n + r[k], 0);
  const totals = {
    transcripts: rows.length,
    expected: sum("expected"),
    correct: sum("correct"),
    wrong: rows.reduce((n, r) => n + r.wrong.length, 0),
    missed: rows.reduce((n, r) => n + r.missed.length, 0),
    dropped: sum("dropped"),
  };
  writeFileSync(path.join("eval", "results.json"), JSON.stringify({ runAt: new Date().toISOString(), totals, rows }, null, 2) + "\n");
  console.log(`\n${totals.correct}/${totals.expected} facts right, ${totals.wrong} wrong value, ${totals.missed} missed, ${totals.dropped} ungrounded dropped`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
