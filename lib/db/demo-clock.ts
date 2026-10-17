import { eq } from "drizzle-orm";
import { getDb, schema } from "./index";

// SIMULATED time for the demo: the tracker's "today" can be pushed forward to show weeks passing.
const KEY = "demoOffsetDays";
const DAY = 24 * 60 * 60 * 1000;

export async function demoOffsetDays(): Promise<number> {
  const db = await getDb();
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, KEY));
  return typeof row?.value === "number" ? row.value : 0;
}

export async function demoToday(): Promise<Date> {
  return new Date(Date.now() + (await demoOffsetDays()) * DAY);
}

export async function setDemoOffset(days: number) {
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: KEY, value: days })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: days } });
}

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY);
