import type {
  Citation,
  EligibilityResult,
  EligibilityStatus,
  Fact,
  FactField,
  FactValue,
  Param,
  ProgramId,
} from "@/lib/types";

export const RULES_VERSION = "2026.10.1";

/** When the rules are run. The application is assumed to be sent in this month. */
export type RuleContext = { asOf: Date };

/** The demo's fixed "today", so amounts don't drift while we present. */
export const DEMO_DATE = new Date(2026, 9, 17);

export const defaultContext = (): RuleContext => ({ asOf: DEMO_DATE });

/** Benefit years run July to June: Oct 2026 is in "2026-27". */
export function benefitYearOf(date: Date): string {
  const start = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
  return benefitYearLabel(start);
}

export function benefitYearLabel(startYear: number): string {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function benefitYearStart(label: string): number {
  return Number(label.slice(0, 4));
}

/** The `count` whole months before `date`'s month, oldest first, as { year, month (0-11) }. */
export function monthsBefore(date: Date, count: number): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  for (let back = count; back >= 1; back--) {
    const d = new Date(date.getFullYear(), date.getMonth() - back, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
}

export const quarterKey = ({ year, month }: { year: number; month: number }): string =>
  `${year}-Q${Math.floor(month / 3) + 1}`;

export const round2 = (amount: number): number => Math.round(amount * 100) / 100;

/** CRA truncates reductions to the cent. */
export const floorCents = (amount: number): number => Math.floor(amount * 100 + 1e-9) / 100;

/** Read-only view over a client's facts. Only confirmed facts count; everything else is unknown. */
export class FactBook {
  private readonly byField = new Map<FactField, Fact>();

  constructor(facts: Fact[]) {
    for (const fact of facts) {
      if (fact.confirmed) this.byField.set(fact.field, fact);
    }
  }

  has(field: FactField): boolean {
    return this.byField.has(field);
  }

  get(field: FactField): FactValue | undefined {
    return this.byField.get(field)?.value;
  }

  number(field: FactField): number | undefined {
    const value = this.get(field);
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
    return undefined;
  }

  bool(field: FactField): boolean | undefined {
    const value = this.get(field);
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "yes") return true;
    if (value === "false" || value === "no") return false;
    return undefined;
  }

  string(field: FactField): string | undefined {
    const value = this.get(field);
    return value === undefined ? undefined : String(value);
  }

  /** Indexes of children we know about, from household.childCount or any child.N.* fact. */
  childIndexes(): number[] {
    const seen = new Set<number>();
    const count = this.number("household.childCount");
    if (count !== undefined) for (let i = 0; i < count; i++) seen.add(i);
    for (const field of this.byField.keys()) {
      const match = /^child\.(\d+)\./.exec(field);
      if (match) seen.add(Number(match[1]));
    }
    return [...seen].sort((a, b) => a - b);
  }
}

/** Collects the explanation for one program while its rule runs. */
export class ResultBuilder {
  private readonly reasons: string[] = [];
  private readonly assumptions: string[] = [];
  private readonly missing = new Set<FactField>();
  private readonly citations = new Map<string, Citation>();
  private deadlineInfo?: { date: string; note: string };

  constructor(
    private readonly program: ProgramId,
    private readonly benefitYear: string,
  ) {}

  because(reason: string): this {
    this.reasons.push(reason);
    return this;
  }

  assume(assumption: string): this {
    this.assumptions.push(assumption);
    return this;
  }

  need(...fields: FactField[]): this {
    for (const field of fields) this.missing.add(field);
    return this;
  }

  cite(label: string, url: string): this {
    this.citations.set(url, { label, url });
    return this;
  }

  /** Cite every parameter a calculation used. */
  citeParams(label: string, ...params: Param<unknown>[]): this {
    for (const param of params) this.cite(label, param.sourceUrl);
    return this;
  }

  deadline(date: string, note: string): this {
    this.deadlineInfo = { date, note };
    return this;
  }

  get isMissingFacts(): boolean {
    return this.missing.size > 0;
  }

  /**
   * Finish the result. A "likely" verdict is downgraded to "possible" while facts are missing,
   * so an unconfirmed answer can never look certain.
   */
  done(status: EligibilityStatus, amounts: { annual?: number; backPay?: number } = {}): EligibilityResult {
    const finalStatus: EligibilityStatus = status === "likely" && this.isMissingFacts ? "possible" : status;
    const keepAmounts = finalStatus !== "not_eligible";
    return {
      program: this.program,
      status: finalStatus,
      annualEstimate: keepAmounts && amounts.annual !== undefined ? roundDollars(amounts.annual) : undefined,
      backPayEstimate: keepAmounts && amounts.backPay !== undefined ? roundDollars(amounts.backPay) : undefined,
      reasons: this.reasons,
      assumptions: this.assumptions,
      missing: [...this.missing],
      citations: [...this.citations.values()],
      benefitYear: this.benefitYear,
      rulesVersion: RULES_VERSION,
      ...(keepAmounts && this.deadlineInfo ? { deadline: this.deadlineInfo } : {}),
    };
  }
}

export function roundDollars(amount: number): number {
  return Math.round(amount);
}

/** Reduce `amount` by `rate` of income above `threshold`, never below zero. */
export function phaseOut(amount: number, income: number, threshold: number, rate: number): number {
  return Math.max(0, amount - Math.max(0, income - threshold) * rate);
}

/** Grow from zero at `start` by `rate` per dollar of income, capped at `max`. */
export function phaseIn(income: number, start: number, rate: number, max: number): number {
  return Math.min(max, Math.max(0, income - start) * rate);
}

export const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);
