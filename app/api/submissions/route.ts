import { getDb, ensureSurveySchema } from "@/db";
import { surveyResponses } from "@/db/schema";
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  SURVEYS,
  SURVEY_VERSION,
  cohortForAge,
  type AnswerValue,
  type Cohort,
  type SurveyQuestion,
} from "@/lib/survey";

const MAX_REQUEST_BYTES = 40_000;
const SUBMISSION_ID_PATTERN = /^[a-zA-Z0-9-]{16,80}$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(error: string) {
  return Response.json({ error }, { status: 400 });
}

function normalizeAnswer(question: SurveyQuestion, value: unknown): AnswerValue | null {
  if (question.type === "text") {
    if (value === undefined || value === null || value === "") return "";
    if (typeof value !== "string") return null;
    const answer = value.trim();
    if (answer.length > (question.maxLength ?? 800)) return null;
    return answer;
  }

  if (question.type === "scale") {
    if (typeof value !== "number" || !Number.isInteger(value)) return null;
    const allowed = question.options?.some((option) => option.value === value);
    return allowed ? value : null;
  }

  if (question.type === "single") {
    if (typeof value !== "string") return null;
    const allowed = question.options?.some((option) => option.value === value);
    return allowed ? value : null;
  }

  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.length > (question.options?.length ?? 0)) return null;
  if (!value.every((item) => typeof item === "string")) return null;

  const selected = value as string[];
  if (new Set(selected).size !== selected.length) return null;
  const allowed = selected.every((item) =>
    question.options?.some((option) => option.value === item),
  );
  return allowed ? selected : null;
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_REQUEST_BYTES) {
    return Response.json({ error: "응답 내용이 너무 큽니다." }, { status: 413 });
  }

  let payload: UnknownRecord;
  try {
    const parsed = await request.json();
    if (!isRecord(parsed)) return invalid("올바른 설문 응답이 아닙니다.");
    if (JSON.stringify(parsed).length > MAX_REQUEST_BYTES) {
      return Response.json({ error: "응답 내용이 너무 큽니다." }, { status: 413 });
    }
    payload = parsed;
  } catch {
    return invalid("응답 형식을 확인해 주세요.");
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return Response.json({ id: String(payload.submissionId ?? "received") }, { status: 201 });
  }

  const submissionId = typeof payload.submissionId === "string" ? payload.submissionId : "";
  const surveyVersion = typeof payload.surveyVersion === "string" ? payload.surveyVersion : "";
  const cohort = payload.cohort;
  const ageBand = typeof payload.ageBand === "string" ? payload.ageBand : "";
  const gender = typeof payload.gender === "string" ? payload.gender : "";
  const genderOther = typeof payload.genderOther === "string" ? payload.genderOther.trim() : "";

  if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
    return invalid("응답 식별값이 올바르지 않습니다. 페이지를 새로 열어 다시 시도해 주세요.");
  }
  if (surveyVersion !== SURVEY_VERSION) {
    return invalid("설문이 업데이트되었습니다. 페이지를 새로 열어 다시 참여해 주세요.");
  }
  if (cohort !== "20s" && cohort !== "30s") {
    return invalid("연령대를 다시 선택해 주세요.");
  }
  if (!AGE_OPTIONS.some((option) => option.value === ageBand) || cohortForAge(ageBand) !== cohort) {
    return invalid("선택한 연령대와 설문이 일치하지 않습니다.");
  }
  if (!GENDER_OPTIONS.includes(gender as (typeof GENDER_OPTIONS)[number])) {
    return invalid("성별 응답을 다시 선택해 주세요.");
  }
  if (genderOther.length > 40) {
    return invalid("성별 직접 입력은 40자 이내로 작성해 주세요.");
  }
  if (!isRecord(payload.answers)) {
    return invalid("설문 응답을 확인해 주세요.");
  }

  const definition = SURVEYS[cohort as Cohort];
  const validQuestionIds = new Set(definition.questions.map((question) => question.id));
  const unknownQuestion = Object.keys(payload.answers).find((key) => !validQuestionIds.has(key));
  if (unknownQuestion) {
    return invalid("설문에 없는 문항이 포함되어 있습니다.");
  }

  const normalizedAnswers: Record<string, AnswerValue> = { q1: ageBand };
  for (const question of definition.questions) {
    const value = payload.answers[question.id];
    const normalized = normalizeAnswer(question, value);

    if (normalized === null || (question.required && normalized === "")) {
      return invalid(`${question.number}번 문항의 응답을 확인해 주세요.`);
    }
    normalizedAnswers[question.id] = normalized;
  }

  const storedGender =
    gender === "기타" && genderOther
      ? `기타: ${genderOther.replace(/\s+/g, " ")}`
      : gender;

  try {
    await ensureSurveySchema();
    const database = getDb();
    await database
      .insert(surveyResponses)
      .values({
        id: submissionId,
        surveyVersion,
        cohort,
        ageBand,
        gender: storedGender,
        answersJson: JSON.stringify(normalizedAnswers),
      })
      .onConflictDoNothing();

    return Response.json({ id: submissionId }, { status: 201 });
  } catch (error) {
    console.error("Failed to save survey response", error);
    return Response.json(
      { error: "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
