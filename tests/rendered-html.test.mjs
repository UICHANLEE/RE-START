import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("packages the Vercel-ready Korean survey and Neon storage", async () => {
  const [layout, form, survey, database, schema, exportRoute, reportRoute, resultsPage, reportPage, env, packageJson] = await Promise.all([
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(new URL("app/SurveyForm.tsx", projectRoot), "utf8"),
    readFile(new URL("lib/survey.ts", projectRoot), "utf8"),
    readFile(new URL("db/index.ts", projectRoot), "utf8"),
    readFile(new URL("db/schema.sql", projectRoot), "utf8"),
    readFile(new URL("app/api/admin/export/route.ts", projectRoot), "utf8"),
    readFile(new URL("app/api/admin/report/route.ts", projectRoot), "utf8"),
    readFile(new URL("app/results/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/report/page.tsx", projectRoot), "utf8"),
    readFile(new URL(".env.example", projectRoot), "utf8"),
    readFile(new URL("package.json", projectRoot), "utf8"),
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
  assert.match(database, /@neondatabase\/serverless/);
  assert.match(database, /process\.env\.DATABASE_URL/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS survey_responses/);
  assert.match(exportRoute, /timingSafeEqual/);
  assert.match(exportRoute, /전체 응답/);
  assert.match(exportRoute, /text\/csv; charset=utf-8/);
  assert.match(reportRoute, /scaleQuestions/);
  assert.match(reportRoute, /textQuestions/);
  assert.match(reportRoute, /count >= 2/);
  assert.match(reportRoute, /Cache-Control.*no-store/s);
  assert.match(resultsPage, /Excel 파일 받기/);
  assert.match(reportPage, /응답 분석 리포트/);
  assert.match(reportPage, /최근 14일 참여 추이/);
  assert.match(reportPage, /긍정·부정 응답 분포/);
  assert.match(reportPage, /문항별 공통 키워드/);
  assert.match(env, /EXPORT_SECRET/);

  const manifest = JSON.parse(packageJson);
  assert.equal(manifest.scripts.build, "next build");
  assert.equal(manifest.scripts.dev, "next dev");
  assert.ok(manifest.dependencies["@neondatabase/serverless"]);
  assert.ok(manifest.dependencies.exceljs);
  assert.equal(manifest.dependencies["drizzle-orm"], undefined);
  assert.equal(manifest.devDependencies.vinext, undefined);
  await access(new URL(".next/BUILD_ID", projectRoot));
  await access(new URL("public/og.png", projectRoot));
});
