import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const surveyResponses = sqliteTable(
  "survey_responses",
  {
    id: text("id").primaryKey(),
    surveyVersion: text("survey_version").notNull(),
    cohort: text("cohort").notNull(),
    ageBand: text("age_band").notNull(),
    gender: text("gender").notNull(),
    answersJson: text("answers_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("survey_responses_cohort_created_idx").on(table.cohort, table.createdAt),
  ],
);
