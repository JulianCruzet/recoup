// Spoken numbers, as speech recognition or the model sometimes writes them.

const UNITS: Record<string, number> = {
  zero: 0, a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
  twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

/** "fifty-eight" → 58, "seventeen thousand two hundred" → 17200. Undefined unless every word is a number word. */
export function wordsToNumber(text: string): number | undefined {
  const words = text.toLowerCase().replace(/-/g, " ").replace(/\band\b/g, " ").split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  for (const w of words) {
    if (w in UNITS) current += UNITS[w];
    else if (w in TENS) current += TENS[w];
    else if (w === "hundred") current = (current || 1) * 100;
    else if (w === "thousand") {
      total += (current || 1) * 1000;
      current = 0;
    } else return undefined;
  }
  return words.length > 0 ? total + current : undefined;
}

// "a" only counts as a number in "a hundred" or "a thousand", never in "a year".
const isNumberWord = (w: string) => w !== "a" && (w in UNITS || w in TENS || w === "hundred" || w === "thousand" || w === "and");
const startsNumber = (words: string[], i: number) =>
  (isNumberWord(words[i]) && words[i] !== "and") || (words[i] === "a" && ["hundred", "thousand"].includes(words[i + 1]));

/**
 * The number a quote states: digits first ("2019", "$1,250"), otherwise the first run of number words
 * ("about fourteen thousand a year"). Monthly amounts are turned into yearly ones when `yearly` is set.
 */
export function numberInQuote(quote: string, yearly = false): number | undefined {
  const perMonth = yearly && /\b(a|per|each|every) month\b|\bmonthly\b/i.test(quote);
  const digits = /\d[\d,]*(\.\d+)?/.exec(quote);
  let n: number | undefined = digits ? Number(digits[0].replace(/,/g, "")) : undefined;
  if (n === undefined) {
    const words = quote.toLowerCase().replace(/-/g, " ").replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);
    const start = words.findIndex((_, i) => startsNumber(words, i));
    if (start >= 0) {
      let end = start + 1;
      while (end < words.length && isNumberWord(words[end])) end++;
      n = wordsToNumber(words.slice(start, end).join(" "));
    }
  }
  return n !== undefined && perMonth ? n * 12 : n;
}
