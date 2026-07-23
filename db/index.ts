import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let queryClient: NeonQueryFunction<false, false> | null = null;
let schemaInitialization: Promise<void> | null = null;

export function getSql() {
  if (queryClient) return queryClient;

  const databaseUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL이 설정되지 않았습니다. Vercel Marketplace에서 Neon 데이터베이스를 연결해 주세요.",
    );
  }

  queryClient = neon(databaseUrl);
  return queryClient;
}

export async function ensureSurveySchema() {
  if (!schemaInitialization) {
    const sql = getSql();
    schemaInitialization = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS survey_responses (
          id TEXT PRIMARY KEY,
          survey_version TEXT NOT NULL,
          cohort TEXT NOT NULL,
          age_band TEXT NOT NULL,
          gender TEXT NOT NULL,
          answers_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS survey_responses_cohort_created_idx
        ON survey_responses (cohort, created_at DESC)
      `;
    })().catch((error: unknown) => {
      schemaInitialization = null;
      throw error;
    });
  }

  await schemaInitialization;
}
