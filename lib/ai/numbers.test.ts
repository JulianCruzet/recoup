import { describe, expect, it } from "vitest";
import { numberInQuote, wordsToNumber } from "./numbers";

describe("wordsToNumber", () => {
  it.each([
    ["fifty-eight", 58],
    ["fourteen thousand", 14000],
    ["seventeen thousand two hundred", 17200],
    ["twelve hundred", 1200],
    ["a thousand", 1000],
    ["one hundred and five", 105],
    ["ninety-one thousand", 91000],
  ])("%s → %d", (text, n) => {
    expect(wordsToNumber(text)).toBe(n);
  });

  it("leaves anything that isn't a number alone", () => {
    expect(wordsToNumber("widowed")).toBeUndefined();
    expect(wordsToNumber("about fifty")).toBeUndefined();
    expect(wordsToNumber("")).toBeUndefined();
  });
});

describe("numberInQuote", () => {
  it.each([
    ["2019", false, 2019],
    ["it was 2021, not 2022", false, 2021],
    ["sixty-nine", false, 69],
    ["about fourteen thousand a year", true, 14000],
    ["twelve hundred a month", true, 14400],
    ["$1,250 a month", true, 15000],
    ["a thousand a month", true, 12000],
  ])("%s → %d", (quote, yearly, n) => {
    expect(numberInQuote(quote, yearly)).toBe(n);
  });

  it("finds nothing in a quote without a number", () => {
    expect(numberInQuote("I'm widowed")).toBeUndefined();
  });
});
