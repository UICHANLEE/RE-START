import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let schemaInitialization: Promise<void> | null = null;

function getBinding() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB`.",
    );
  }
  return env.DB;
}

export function getDb() {
  return drizzle(getBinding(), { schema });
}

export async function ensureSurveySchema() {
  if (!schemaInitialization) {
    const database = getBinding();
    schemaInitialization = database
      .batch([
        database.prepare(`
          CREATE TABLE IF NOT EXISTS survey_responses (
            id TEXT PRIMARY KEY NOT NULL,
            survey_version TEXT NOT NULL,
            cohort TEXT NOT NULL,
            age_band TEXT NOT NULL,
            gender TEXT NOT NULL,
            answers_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `),
        database.prepare(`
          CREATE INDEX IF NOT EXISTS survey_responses_cohort_created_idx
          ON survey_responses (cohort, created_at)
        `),
      ])
      .then(() => undefined)
      .catch((error: unknown) => {
        schemaInitialization = null;
        throw error;
      });
  }

  await schemaInitialization;
}
