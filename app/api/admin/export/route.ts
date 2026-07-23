import { timingSafeEqual } from "node:crypto";
import ExcelJS from "exceljs";

import { ensureSurveySchema, getSql } from "@/db";
import { SURVEYS, type AnswerValue, type Cohort } from "@/lib/survey";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportFormat = "csv" | "xlsx";
type AnswerMap = Record<string, AnswerValue>;

interface SurveyRow {
  id: string;
  survey_version: string;
  cohort: Cohort;
  age_band: string;
  gender: string;
  answers_json: AnswerMap | string;
  created_at: Date | string;
}

const QUESTION_ONE = "현재 연령대는 어떻게 됩니까?";
const BASE_HEADERS = ["응답 ID", "제출 일시", "설문 버전", "연령 구분", "연령대", "성별"];

function secretsMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function answerMap(value: SurveyRow["answers_json"]): AnswerMap {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as AnswerMap;
    } catch {
      return {};
    }
  }
  return value ?? {};
}

function displayAnswer(value: AnswerValue | undefined) {
  if (Array.isArray(value)) return value.join(" | ");
  return value === undefined || value === null ? "" : String(value);
}

function safeCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function submittedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function cohortLabel(cohort: Cohort) {
  return cohort === "20s" ? "20대" : "30대";
}

function rowValues(row: SurveyRow) {
  const answers = answerMap(row.answers_json);
  return [
    row.id,
    submittedAt(row.created_at),
    row.survey_version,
    cohortLabel(row.cohort),
    row.age_band,
    row.gender,
    ...Array.from({ length: 20 }, (_, index) => displayAnswer(answers[`q${index + 1}`])),
  ];
}

function csvEscape(value: string) {
  const safe = safeCell(value);
  return `"${safe.replaceAll('"', '""')}"`;
}

function createCsv(rows: SurveyRow[]) {
  const headers = [
    ...BASE_HEADERS,
    ...Array.from({ length: 20 }, (_, index) => `Q${index + 1}`),
  ];
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => rowValues(row).map((value) => csvEscape(String(value))).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function questionHeaders(cohort?: Cohort) {
  if (!cohort) {
    return Array.from({ length: 20 }, (_, index) => `Q${index + 1}`);
  }
  return [
    `Q1. ${QUESTION_ONE}`,
    ...SURVEYS[cohort].questions.map((question) => `Q${question.number}. ${question.prompt}`),
  ];
}

function addWorksheet(workbook: ExcelJS.Workbook, name: string, rows: SurveyRow[], cohort?: Cohort) {
  const worksheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const headers = [...BASE_HEADERS, ...questionHeaders(cohort)];
  worksheet.addRow(headers);

  for (const surveyRow of rows) {
    worksheet.addRow(rowValues(surveyRow).map((value) => safeCell(String(value))));
  }

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17365D" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  header.height = 42;
  worksheet.autoFilter = { from: "A1", to: worksheet.getCell(1, headers.length).address };

  worksheet.columns.forEach((column, index) => {
    if (index === 0) column.width = 38;
    else if (index === 1) column.width = 22;
    else if (index < BASE_HEADERS.length) column.width = 16;
    else column.width = cohort ? 34 : 20;
    column.alignment = { vertical: "top", wrapText: true };
  });
}

async function createWorkbook(rows: SurveyRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "재건총회신학원 RE:START";
  workbook.created = new Date();
  addWorksheet(workbook, "전체 응답", rows);
  addWorksheet(workbook, "20대", rows.filter((row) => row.cohort === "20s"), "20s");
  addWorksheet(workbook, "30대", rows.filter((row) => row.cohort === "30s"), "30s");
  return workbook.xlsx.writeBuffer();
}

export async function POST(request: Request) {
  const expectedSecret = process.env.EXPORT_SECRET;
  if (!expectedSecret) {
    return Response.json(
      { error: "관리자 내보내기 비밀번호가 설정되지 않았습니다." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: { secret?: unknown; format?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const secret = typeof payload.secret === "string" ? payload.secret : "";
  const format = payload.format;
  if (!secretsMatch(secret, expectedSecret)) {
    return Response.json(
      { error: "내보내기 비밀번호가 올바르지 않습니다." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (format !== "csv" && format !== "xlsx") {
    return Response.json({ error: "지원하지 않는 파일 형식입니다." }, { status: 400 });
  }

  try {
    await ensureSurveySchema();
    const sql = getSql();
    const rows = (await sql`
      SELECT id, survey_version, cohort, age_band, gender, answers_json, created_at
      FROM survey_responses
      ORDER BY created_at DESC
    `) as SurveyRow[];
    const date = new Date().toISOString().slice(0, 10);
    const filename = `restart-survey-results-${date}.${format as ExportFormat}`;
    const headers = {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
    };

    if (format === "csv") {
      return new Response(createCsv(rows), {
        headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
      });
    }

    const workbook = await createWorkbook(rows);
    return new Response(Buffer.from(workbook), {
      headers: {
        ...headers,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Failed to export survey responses", error);
    return Response.json(
      { error: "설문 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
