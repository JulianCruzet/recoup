import { describe, expect, it } from "vitest";
import { sampleRateOf, toWav } from "./wav";

const text = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

describe("toWav", () => {
  it("wraps raw PCM in a playable WAV header", () => {
    const pcm = new Uint8Array([1, 2, 3, 4, 5, 6]);
    const wav = toWav(pcm, 24000);
    const view = new DataView(wav.buffer);
    expect(wav.length).toBe(44 + pcm.length);
    expect(text(wav, 0, 4)).toBe("RIFF");
    expect(text(wav, 8, 16)).toBe("WAVEfmt ");
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(text(wav, 36, 40)).toBe("data");
    expect(view.getUint32(40, true)).toBe(pcm.length);
    expect([...wav.subarray(44)]).toEqual([...pcm]);
  });

  it("leaves audio that is already a WAV alone", () => {
    const wav = new Uint8Array([82, 73, 70, 70, 0, 0]);
    expect(toWav(wav)).toBe(wav);
  });
});

describe("sampleRateOf", () => {
  it("reads the rate from the mime type, defaulting to 24 kHz", () => {
    expect(sampleRateOf("audio/L16;codec=pcm;rate=16000")).toBe(16000);
    expect(sampleRateOf("audio/wav")).toBe(24000);
    expect(sampleRateOf(undefined)).toBe(24000);
  });
});
