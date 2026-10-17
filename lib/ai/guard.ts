import type { EligibilityResult } from "@/lib/types";

// "12,236", "12 236", "12.236" and "2016" all read as one number; separators differ by language.
const NUMBER = /\d[\d,.   ]*\d|\d/g;
const digitsOf = (s: string) => Number(s.replace(/[^\d]/g, ""));

/** Every number the rules engine itself wrote for this result: amounts, plus years, ages and counts in its reasons. */
export function ruleNumbers(result: EligibilityResult): Set<number> {
  const out = new Set<number>();
  for (const n of [result.backPayEstimate, result.annualEstimate]) if (n) out.add(Math.round(n));
  for (const text of [...result.reasons, ...result.assumptions]) {
    for (const m of text.matchAll(NUMBER)) {
      out.add(digitsOf(m[0]));
      // "$1,138.90" is also fine as "$1,138" or "1138".
      const whole = m[0].split(/[.,](?=\d{2}$)/)[0];
      out.add(digitsOf(whole));
    }
  }
  return out;
}

/** True when the AI's text only uses numbers the rules produced. Otherwise show the rules' own words. */
export function onlyRuleNumbers(text: string, result: EligibilityResult): boolean {
  // Digits from other scripts (Arabic-Indic, Gurmukhi, Tamil, full-width…) can't be checked, so they fail.
  if (/(?![0-9])\p{Nd}/u.test(text)) return false;
  // "12k", "12 thousand", "1.2万" hide a big number behind a small one.
  if (/\d\s*(?:k\b|thousand|million|mille|lakh|crore|万|千|萬)/iu.test(text)) return false;
  const allowed = ruleNumbers(result);
  return [...text.matchAll(NUMBER)].every((m) => {
    const n = digitsOf(m[0]);
    // Small counts ("2 years", "one of 3 forms") are fine; anything that could be money or a year must match.
    return n < 100 || allowed.has(n) || allowed.has(Math.round(Number(m[0].replace(/[^\d.]/g, ""))));
  });
}
