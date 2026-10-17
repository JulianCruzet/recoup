// Minimal Gemini REST client (server only). Keeps the key out of the browser and out of logs.
import "server-only";

// Each free-tier model has its own rate limit, so when one is busy (429/5xx/timeout) we try the next.
export const GEMINI_MODELS = (process.env.GEMINI_MODELS ?? "gemini-3.8-flash,gemini-3.5-flash,gemini-3.5-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

class RateLimited extends Error {}

async function call<T>(model: string, opts: { system: string; parts: Part[]; schema: object; temperature?: number; timeoutMs?: number }): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 25000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: opts.parts }],
      generationConfig: {
        temperature: opts.temperature ?? 0,
        responseMimeType: "application/json",
        responseSchema: opts.schema,
      },
    }),
  });
  // Busy, down or retired: try the next model.
  if (res.status === 429 || res.status === 404 || res.status >= 500) throw new RateLimited(`${model} unavailable (${res.status})`);
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const text: string = body.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  try {
    return JSON.parse(text) as T;
  } catch {
    // An empty or blocked reply isn't usable; the next model may do better.
    throw new RateLimited(`${model} returned no usable JSON`);
  }
}

export async function generateJson<T>(opts: { system: string; parts: Part[]; schema: object; temperature?: number; timeoutMs?: number }): Promise<T> {
  let last: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      return await call<T>(model, opts);
    } catch (error) {
      last = error;
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (!(error instanceof RateLimited) && !timedOut) throw error;
    }
  }
  throw last instanceof Error ? last : new Error("All Gemini models are rate limited");
}

/** Run async jobs with at most `limit` in flight. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}
