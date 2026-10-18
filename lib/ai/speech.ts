// Gemini text-to-speech (server only): reads an explanation aloud in the client's language.
import "server-only";
import { sampleRateOf, toWav } from "./wav";

// Speech models have small free-tier limits, so when one is busy (429/5xx/timeout) we try the next.
export const TTS_MODELS = (process.env.GEMINI_TTS_MODELS ?? "gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts,gemini-2.5-flash-preview-tts")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// A warm, clear prebuilt voice; Gemini picks the accent from the language of the text.
const VOICE = process.env.GEMINI_TTS_VOICE ?? "Kore";

class Busy extends Error {}

async function call(model: string, text: string, language: string): Promise<Uint8Array> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `Read this aloud in ${language}, warmly and clearly, at a calm pace:\n\n${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
      },
    }),
  });
  if (res.status === 429 || res.status === 404 || res.status >= 500) throw new Busy(`${model} unavailable (${res.status})`);
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const audio = body.candidates?.[0]?.content?.parts?.find((p: { inlineData?: unknown }) => p.inlineData)?.inlineData as
    | { data: string; mimeType?: string }
    | undefined;
  if (!audio?.data) throw new Busy(`${model} returned no audio`);
  return toWav(new Uint8Array(Buffer.from(audio.data, "base64")), sampleRateOf(audio.mimeType));
}

/** The text spoken aloud as a WAV file. */
export async function speak(text: string, language: string): Promise<Uint8Array> {
  let last: unknown;
  for (const model of TTS_MODELS) {
    try {
      return await call(model, text, language);
    } catch (error) {
      last = error;
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      if (!(error instanceof Busy) && !timedOut) throw error;
    }
  }
  throw last instanceof Error ? last : new Error("All speech models are busy");
}
