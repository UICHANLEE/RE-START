import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("packages the Korean mobile survey and its durable storage", async () => {
  const [layout, form, survey, hosting, migration] = await Promise.all([
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(new URL("app/SurveyForm.tsx", projectRoot), "utf8"),
    readFile(new URL("lib/survey.ts", projectRoot), "utf8"),
    readFile(new URL("dist/.openai/hosting.json", projectRoot), "utf8"),
    readFile(new URL("dist/.openai/drizzle/0000_greedy_nico_minoru.sql", projectRoot), "utf8"),
  ]);

  assert.match(layout, /<html lang="ko">/);
  assert.match(layout, /RE:START \| 재건총회신학원 청년 인식조사/);
  assert.match(layout, /\/og\.png/);
  assert.match(form, /당신의 오늘을 듣고/);
  assert.match(form, /QRCodeCanvas/);
  assert.match(survey, /20~24세/);
  assert.match(survey, /35~39세/);
  assert.match(survey, /응답하지 않음/);
  assert.match(survey, /앞으로 2년 안에/);
  assert.match(survey, /앞으로 3년 안에/);
  const hostingConfig = JSON.parse(hosting);
  assert.match(hostingConfig.project_id, /^appgprj_/);
  assert.equal(hostingConfig.d1, "DB");
  assert.equal(hostingConfig.r2, null);
  assert.match(migration, /CREATE TABLE `survey_responses`/);
  assert.match(migration, /survey_responses_cohort_created_idx/);
  await access(new URL("dist/client/og.png", projectRoot));
});
