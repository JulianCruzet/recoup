/**
 * Gemini's speech comes back as raw 16-bit mono PCM (sometimes already as a WAV). Browsers can't play raw PCM,
 * so wrap it in a 44-byte WAV header. Data that already starts with "RIFF" is returned as it is.
 */
export function toWav(audio: Uint8Array, sampleRate = 24000): Uint8Array {
  if (audio.length >= 4 && String.fromCharCode(...audio.subarray(0, 4)) === "RIFF") return audio;
  const header = new DataView(new ArrayBuffer(44));
  const ascii = (offset: number, text: string) => [...text].forEach((c, i) => header.setUint8(offset + i, c.charCodeAt(0)));
  ascii(0, "RIFF");
  header.setUint32(4, 36 + audio.length, true);
  ascii(8, "WAVEfmt ");
  header.setUint32(16, 16, true); // fmt chunk size
  header.setUint16(20, 1, true); // PCM
  header.setUint16(22, 1, true); // mono
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * 2, true); // bytes per second
  header.setUint16(32, 2, true); // bytes per sample
  header.setUint16(34, 16, true); // bits per sample
  ascii(36, "data");
  header.setUint32(40, audio.length, true);
  const wav = new Uint8Array(44 + audio.length);
  wav.set(new Uint8Array(header.buffer), 0);
  wav.set(audio, 44);
  return wav;
}

/** The sample rate in a mime type like "audio/L16;codec=pcm;rate=24000", or 24000 when it isn't given. */
export function sampleRateOf(mimeType: string | undefined): number {
  const rate = Number(/rate=(\d+)/.exec(mimeType ?? "")?.[1]);
  return Number.isFinite(rate) && rate > 0 ? rate : 24000;
}
