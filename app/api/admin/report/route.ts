import { timingSafeEqual } from "node:crypto";

import { ensureSurveySchema, getSql } from "@/db";
import { SURVEYS, type AnswerValue, type Cohort, type SurveyQuestion } from "@/lib/survey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnswerMap = Record<string, AnswerValue>;

interface SurveyRow {
  cohort: Cohort;
  age_band: string;
  gender: string;
  answers_json: AnswerMap | string;
  created_at: Date | string;
}

function secretMatches(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function parseAnswers(value: SurveyRow["answers_json"]): AnswerMap {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value) as AnswerMap;
  } catch {
    return {};
  }
}

function percentage(count: number, total: number) {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}

function breakdown(values: string[], order?: readonly string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const labels = order
    ? [
        ...order.filter((label) => counts.has(label)),
        ...[...counts.keys()].filter((label) => !order.includes(label)),
      ]
    : [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  return labels.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
    percent: percentage(counts.get(label) ?? 0, values.length),
  }));
}

function scaleSummary(question: SurveyQuestion, rows: SurveyRow[], cohort: Cohort) {
  const distribution = [1, 2, 3, 4, 5].map((value) => ({ value, count: 0, percent: 0 }));
  const values = rows
    .map((row) => parseAnswers(row.answers_json)[question.id])
    .filter((value): value is number => typeof value === "number" && value >= 1 && value <= 5);
  values.forEach((value) => {
    distribution[value - 1].count += 1;
  });
  distribution.forEach((item) => {
    item.percent = percentage(item.count, values.length);
  });
  return {
    cohort,
    id: question.id,
    number: question.number,
    prompt: question.prompt,
    responses: values.length,
    average: values.length
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
      : 0,
    distribution,
  };
}

function choiceSummary(question: SurveyQuestion, rows: SurveyRow[], cohort: Cohort) {
  const counts = new Map<string, number>(
    question.options?.map((option) => [String(option.label), 0]) ?? [],
  );
  let responses = 0;
  rows.forEach((row) => {
    const answer = parseAnswers(row.answers_json)[question.id];
    const values = Array.isArray(answer)
      ? answer
      : answer === undefined || answer === ""
        ? []
        : [answer];
    if (values.length) responses += 1;
    values.forEach((value) => {
      const label =
        question.options?.find((option) => option.value === value)?.label ?? String(value);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
  });
  return {
    cohort,
    id: question.id,
    number: question.number,
    prompt: question.prompt,
    type: question.type,
    responses,
    options: [...counts.entries()]
      .map(([label, count]) => ({ label, count, percent: percentage(count, responses) }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko")),
  };
}

function koreanDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function dailyTrend(rows: SurveyRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = koreanDateKey(row.created_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const key = koreanDateKey(date);
    return {
      date: key,
      label: `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`,
      count: counts.get(key) ?? 0,
    };
  });
}

function buildInsights(
  rows: SurveyRow[],
  scaleQuestions: ReturnType<typeof scaleSummary>[],
  choiceQuestions: ReturnType<typeof choiceSummary>[],
) {
  if (!rows.length) return ["아직 제출된 응답이 없습니다."];
  const insights: string[] = [];
  const twenties = rows.filter((row) => row.cohort === "20s").length;
  const thirties = rows.length - twenties;
  insights.push(
    `전체 ${rows.length}명 중 20대 ${twenties}명(${percentage(twenties, rows.length)}%), 30대 ${thirties}명(${percentage(thirties, rows.length)}%)이 참여했습니다.`,
  );

  (["20s", "30s"] as const).forEach((cohort) => {
    const scales = scaleQuestions.filter(
      (question) => question.cohort === cohort && question.responses,
    );
    if (!scales.length) return;
    const strongest = [...scales].sort((a, b) => b.average - a.average)[0];
    const weakest = [...scales].sort((a, b) => a.average - b.average)[0];
    insights.push(
      `${cohort === "20s" ? "20대" : "30대"}의 가장 높은 동의 문항은 “${strongest.prompt}”(${strongest.average}점), 가장 낮은 문항은 “${weakest.prompt}”(${weakest.average}점)입니다.`,
    );
  });

  (["20s", "30s"] as const).forEach((cohort) => {
    const interest = choiceQuestions.find(
      (question) =>
        question.cohort === cohort && question.prompt.includes("관심") && question.responses,
    );
    const top = interest?.options[0];
    if (interest && top) {
      insights.push(
        `${cohort === "20s" ? "20대" : "30대"} 관심 분야에서는 “${top.label}” 응답이 ${top.count}명(${top.percent}%)으로 가장 많았습니다.`,
      );
    }
  });

  if (rows.length < 30) {
    insights.push("현재 표본이 30명 미만이므로 비율과 평균은 초기 경향 확인용으로 해석해 주세요.");
  }
  return insights;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.EXPORT_SECRET;
  if (!expectedSecret) {
    return Response.json(
      { error: "관리자 보고서 비밀번호가 설정되지 않았습니다." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let secret = "";
  try {
    const payload = (await request.json()) as { secret?: unknown };
    secret = typeof payload.secret === "string" ? payload.secret : "";
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!secretMatches(secret, expectedSecret)) {
    return Response.json(
      { error: "보고서 비밀번호가 올바르지 않습니다." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await ensureSurveySchema();
    const sql = getSql();
    const rows = (await sql`
      SELECT cohort, age_band, gender, answers_json, created_at
      FROM survey_responses
      ORDER BY created_at DESC
    `) as SurveyRow[];

    const scaleQuestions = (["20s", "30s"] as const).flatMap((cohort) => {
      const cohortRows = rows.filter((row) => row.cohort === cohort);
      return SURVEYS[cohort].questions
        .filter((question) => question.type === "scale")
        .map((question) => scaleSummary(question, cohortRows, cohort));
    });
    const choiceQuestions = (["20s", "30s"] as const).flatMap((cohort) => {
      const cohortRows = rows.filter((row) => row.cohort === cohort);
      return SURVEYS[cohort].questions
        .filter((question) => question.type === "single" || question.type === "multi")
        .map((question) => choiceSummary(question, cohortRows, cohort));
    });

    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        lastSubmittedAt: rows[0]?.created_at ?? null,
        total: rows.length,
        cohorts: breakdown(
          rows.map((row) => (row.cohort === "20s" ? "20대" : "30대")),
          ["20대", "30대"],
        ),
        ages: breakdown(
          rows.map((row) => row.age_band),
          ["20-24", "25-29", "30-34", "35-39"],
        ),
        genders: breakdown(rows.map((row) => row.gender)),
        daily: dailyTrend(rows),
        scaleQuestions,
        choiceQuestions,
        insights: buildInsights(rows, scaleQuestions, choiceQuestions),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to build survey report", error);
    return Response.json(
      { error: "설문 분석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
