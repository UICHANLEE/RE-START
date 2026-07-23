CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_version TEXT NOT NULL,
  cohort TEXT NOT NULL,
  age_band TEXT NOT NULL,
  gender TEXT NOT NULL,
  answers_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS survey_responses_cohort_created_idx
  ON survey_responses (cohort, created_at DESC);
