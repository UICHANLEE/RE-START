"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  SURVEYS,
  SURVEY_TOTAL_QUESTIONS,
  SURVEY_VERSION,
  cohortForAge,
  sectionForQuestion,
  type AnswerValue,
  type SurveyQuestion,
} from "@/lib/survey";

type Stage = "intro" | "survey" | "success";
type Answers = Record<string, AnswerValue>;

function createSubmissionId() {
  return globalThis.crypto?.randomUUID?.() ??
    `survey-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAnswered(question: SurveyQuestion, value: AnswerValue | undefined) {
  if (!question.required && question.type === "text") return true;
  if (question.type === "multi") return Array.isArray(value) && value.length > 0;
  if (question.type === "scale") return typeof value === "number";
  return typeof value === "string" && value.trim().length > 0;
}

function SurveyQrDialog({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const downloadQr = () => {
    const canvas = document.getElementById("survey-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "재건총회신학원-청년설문-QR.png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="qr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" type="button" onClick={onClose} aria-label="QR 공유 창 닫기">
          ×
        </button>
        <span className="dialog-kicker">설문 공유</span>
        <h2 id="qr-dialog-title">카메라로 QR을 찍어주세요</h2>
        <p>어느 스마트폰에서든 이 설문의 첫 화면으로 바로 연결됩니다.</p>
        <div className="qr-frame">
          {url ? (
            <QRCodeCanvas
              id="survey-qr-canvas"
              value={url}
              size={220}
              level="M"
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#17365d"
              title="재건총회신학원 청년 설문 QR 코드"
            />
          ) : (
            <div className="qr-loading" aria-label="QR 코드 준비 중" />
          )}
        </div>
        <div className="qr-actions">
          <button className="secondary-button" type="button" onClick={copyLink} disabled={!url}>
            {copyState === "copied" ? "복사됨" : "링크 복사"}
          </button>
          <button className="primary-button compact" type="button" onClick={downloadQr} disabled={!url}>
            QR 이미지 저장
          </button>
        </div>
        <p className="copy-status" aria-live="polite">
          {copyState === "copied" && "설문 링크를 복사했습니다."}
          {copyState === "error" && "복사하지 못했습니다. QR 이미지를 저장해 주세요."}
        </p>
      </section>
    </div>
  );
}

export function SurveyForm() {
  const [stage, setStage] = useState<Stage>("intro");
  const [ageBand, setAgeBand] = useState("");
  const [gender, setGender] = useState("");
  const [genderOther, setGenderOther] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState("");
  const [confirmationId, setConfirmationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  const cohort = cohortForAge(ageBand);
  const survey = cohort ? SURVEYS[cohort] : null;
  const selectedAge = AGE_OPTIONS.find((option) => option.value === ageBand);
  const currentQuestion = survey?.questions[questionIndex];
  const surveyUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${window.location.pathname}`;

  useEffect(() => {
    if (stage !== "survey") return;
    questionHeadingRef.current?.focus();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [questionIndex, stage]);

  const progress = currentQuestion
    ? (currentQuestion.number / SURVEY_TOTAL_QUESTIONS) * 100
    : 0;

  const selectAge = (value: string) => {
    if (value !== ageBand) {
      setAnswers({});
      setQuestionIndex(0);
      setFormMessage("");
    }
    setAgeBand(value);
  };

  const startSurvey = () => {
    if (!ageBand || !gender || !survey) {
      setFormMessage("연령대와 성별을 모두 선택해 주세요.");
      return;
    }

    setSubmissionId(createSubmissionId());
    setQuestionIndex(0);
    setStage("survey");
    setFormMessage("");
  };

  const updateSingleAnswer = (questionId: string, value: string | number) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setFormMessage("");
  };

  const toggleMultiAnswer = (questionId: string, value: string) => {
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId])
        ? (current[questionId] as string[])
        : [];
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      return { ...current, [questionId]: next };
    });
    setFormMessage("");
  };

  const submitSurvey = async () => {
    if (!survey || !cohort) return;

    const incompleteQuestion = survey.questions.find(
      (question) => !isAnswered(question, answers[question.id]),
    );

    if (incompleteQuestion) {
      const nextIndex = survey.questions.findIndex((question) => question.id === incompleteQuestion.id);
      setQuestionIndex(nextIndex);
      setFormMessage("필수 문항에 응답해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId,
          surveyVersion: SURVEY_VERSION,
          cohort,
          ageBand,
          gender,
          genderOther: gender === "기타" ? genderOther : "",
          answers,
          website: "",
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !result.id) {
        throw new Error(result.error || "응답을 저장하지 못했습니다.");
      }

      setConfirmationId(result.id);
      setStage("success");
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : "잠시 후 다시 시도해 주세요. 작성한 답변은 그대로 남아 있습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueSurvey = () => {
    if (!currentQuestion || !survey) return;

    if (!isAnswered(currentQuestion, answers[currentQuestion.id])) {
      setFormMessage(
        currentQuestion.type === "multi"
          ? "한 개 이상 선택해 주세요."
          : "응답을 선택해 주세요.",
      );
      return;
    }

    if (questionIndex === survey.questions.length - 1) {
      void submitSurvey();
      return;
    }

    setQuestionIndex((current) => current + 1);
    setFormMessage("");
  };

  const goBack = () => {
    if (questionIndex === 0) {
      setStage("intro");
    } else {
      setQuestionIndex((current) => current - 1);
    }
    setFormMessage("");
  };

  const resetSurvey = () => {
    setStage("intro");
    setAgeBand("");
    setGender("");
    setGenderOther("");
    setAnswers({});
    setQuestionIndex(0);
    setSubmissionId("");
    setConfirmationId("");
    setFormMessage("");
  };

  if (stage === "success" && survey) {
    return (
      <div className={`app-shell success-view cohort-${survey.cohort}`}>
        <header className="site-header compact-header">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">R</span>
            <span>
              <strong>RE:START</strong>
              <small>재건총회신학원 청년 인식조사</small>
            </span>
          </div>
          <button className="header-action" type="button" onClick={() => setQrOpen(true)}>
            QR 공유
          </button>
        </header>

        <main className="success-card">
          <div className="success-mark" aria-hidden="true">✓</div>
          <span className="section-label">응답 완료</span>
          <h1>소중한 의견을 남겨주셔서<br />감사합니다.</h1>
          <p>
            여러분의 답변은 신학원의 모집·교육·장학·진로지원 개선에만 사용됩니다.
          </p>
          <div className="response-ticket">
            <span>익명 응답 번호</span>
            <strong>{confirmationId.slice(0, 8).toUpperCase()}</strong>
          </div>
          <button className="primary-button success-button" type="button" onClick={resetSurvey}>
            새 응답 시작하기
          </button>
        </main>
        <p className="success-footnote">응답 내용에는 이름이나 연락처가 저장되지 않습니다.</p>
        {qrOpen && <SurveyQrDialog url={surveyUrl} onClose={() => setQrOpen(false)} />}
      </div>
    );
  }

  if (stage === "survey" && survey && currentQuestion && selectedAge) {
    const currentAnswer = answers[currentQuestion.id];
    const isLastQuestion = questionIndex === survey.questions.length - 1;

    return (
      <div className={`app-shell survey-view cohort-${survey.cohort}`}>
        <header className="survey-header">
          <div className="survey-header-row">
            <button className="brand-lockup brand-button" type="button" onClick={() => setStage("intro")}>
              <span className="brand-mark" aria-hidden="true">R</span>
              <span>
                <strong>RE:START</strong>
                <small>재건총회신학원</small>
              </span>
            </button>
            <span className="cohort-chip">{survey.label} 설문</span>
          </div>
          <div className="progress-copy">
            <span>{sectionForQuestion(currentQuestion.number)}</span>
            <strong>{currentQuestion.number} / {SURVEY_TOTAL_QUESTIONS}</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="설문 진행률"
            aria-valuemin={1}
            aria-valuemax={SURVEY_TOTAL_QUESTIONS}
            aria-valuenow={currentQuestion.number}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </header>

        <main className="question-wrap">
          <div className="profile-summary" aria-label="선택한 응답자 정보">
            <span>{selectedAge.label}</span>
            <span aria-hidden="true">·</span>
            <span>{gender === "기타" && genderOther.trim() ? `기타 (${genderOther.trim()})` : gender}</span>
            <button type="button" onClick={() => setStage("intro")}>수정</button>
          </div>

          <section className="question-card" aria-labelledby="question-title">
            <div className="question-meta">
              <span className="question-number">{String(currentQuestion.number).padStart(2, "0")}</span>
              <span className="answer-rule">
                {currentQuestion.required ? "필수" : "선택"}
                {currentQuestion.type === "multi" ? " · 복수 선택" : ""}
              </span>
            </div>
            <h1 id="question-title" ref={questionHeadingRef} tabIndex={-1}>
              {currentQuestion.prompt}
            </h1>
            {currentQuestion.help && (
              <p className="question-help" id={`${currentQuestion.id}-help`}>
                {currentQuestion.help}
              </p>
            )}

            {currentQuestion.type === "text" ? (
              <div className="text-answer">
                <textarea
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onChange={(event) =>
                    updateSingleAnswer(currentQuestion.id, event.target.value)
                  }
                  maxLength={currentQuestion.maxLength}
                  rows={7}
                  placeholder="떠오르는 생각을 편하게 적어주세요."
                  aria-labelledby="question-title"
                />
                <span>
                  {typeof currentAnswer === "string" ? currentAnswer.length : 0}
                  /{currentQuestion.maxLength}
                </span>
              </div>
            ) : (
              <fieldset className="answer-fieldset" aria-describedby={currentQuestion.help ? `${currentQuestion.id}-help` : undefined}>
                <legend className="sr-only">{currentQuestion.prompt}</legend>
                <div className={currentQuestion.type === "scale" ? "scale-grid" : "option-list"}>
                  {currentQuestion.options?.map((option) => {
                    const value = option.value;
                    const selected =
                      currentQuestion.type === "multi"
                        ? Array.isArray(currentAnswer) && currentAnswer.includes(String(value))
                        : currentAnswer === value;

                    return (
                      <label
                        className={`${currentQuestion.type === "scale" ? "scale-option" : "answer-option"} ${selected ? "selected" : ""}`}
                        key={String(value)}
                      >
                        <input
                          type={currentQuestion.type === "multi" ? "checkbox" : "radio"}
                          name={currentQuestion.id}
                          value={String(value)}
                          checked={selected}
                          onChange={() => {
                            if (currentQuestion.type === "multi") {
                              toggleMultiAnswer(currentQuestion.id, String(value));
                            } else {
                              updateSingleAnswer(currentQuestion.id, value);
                            }
                          }}
                        />
                        {currentQuestion.type === "scale" ? (
                          <>
                            <span className="scale-number">{value}</span>
                            <span className="scale-label">{option.label}</span>
                          </>
                        ) : (
                          <>
                            <span className="option-control" aria-hidden="true" />
                            <span>{option.label}</span>
                          </>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <p className={`form-message ${formMessage ? "visible" : ""}`} role="alert">
              {formMessage || "응답을 선택하면 다음 문항으로 이동할 수 있습니다."}
            </p>
          </section>
        </main>

        <nav className="survey-nav" aria-label="설문 문항 이동">
          <div>
            <button className="back-button" type="button" onClick={goBack} disabled={isSubmitting}>
              이전
            </button>
            <button
              className="primary-button next-button"
              type="button"
              onClick={continueSurvey}
              disabled={isSubmitting}
            >
              {isSubmitting ? "응답 저장 중…" : isLastQuestion ? "응답 제출하기" : "다음"}
            </button>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className={`app-shell intro-view ${cohort ? `cohort-${cohort}` : "cohort-none"}`}>
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>
            <strong>RE:START</strong>
            <small>재건총회신학원 청년 인식조사</small>
          </span>
        </div>
        <button className="header-action" type="button" onClick={() => setQrOpen(true)}>
          QR로 공유
        </button>
      </header>

      <main className="intro-layout">
        <section className="hero-copy">
          <span className="eyebrow">나의 부르심, 신학으로 다시 시작하다</span>
          <h1>
            당신의 오늘을 듣고,<br />
            <em>더 나은 배움</em>을 준비합니다.
          </h1>
          <p>
            입학을 권유하는 시험이 아닙니다. 신학원이 청년을 더 잘 섬기기 위한 익명 조사입니다.
            정답 없이 솔직한 의견을 들려주세요.
          </p>
          <div className="trust-row" aria-label="설문 안내">
            <span><b>4–6분</b> 예상 소요</span>
            <span><b>100%</b> 익명 응답</span>
            <span><b>20문항</b> 맞춤 설문</span>
          </div>
          <div className="cohort-message" aria-live="polite">
            <span aria-hidden="true">{cohort === "30s" ? "↗" : "↘"}</span>
            <p>
              <strong>{survey ? survey.subtitle : "연령대를 선택하면 맞춤 설문이 열립니다."}</strong>
              <small>{survey ? survey.invitation : "20대와 30대의 삶에 맞춘 서로 다른 질문으로 구성했습니다."}</small>
            </p>
          </div>
        </section>

        <section className="start-card" aria-labelledby="start-card-title">
          <div className="start-card-heading">
            <span>시작하기</span>
            <strong>약 4–6분</strong>
          </div>
          <h2 id="start-card-title">먼저 나에게 맞는 설문을 선택해주세요.</h2>

          <fieldset className="profile-fieldset">
            <legend><b>1</b> 현재 연령대</legend>
            <div className="age-grid">
              {AGE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`age-choice age-${option.cohort} ${ageBand === option.value ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="ageBand"
                    value={option.value}
                    checked={ageBand === option.value}
                    onChange={() => selectAge(option.value)}
                  />
                  <span>{option.label}</span>
                  <small>{option.cohort === "20s" ? "20대 설문" : "30대 설문"}</small>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="profile-fieldset gender-fieldset">
            <legend><b>+</b> 성별</legend>
            <div className="gender-grid">
              {GENDER_OPTIONS.map((option) => (
                <label className={gender === option ? "selected" : ""} key={option}>
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={gender === option}
                    onChange={() => {
                      setGender(option);
                      setFormMessage("");
                    }}
                  />
                  <span className="option-control" aria-hidden="true" />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {gender === "기타" && (
              <label className="other-gender">
                <span>직접 입력 <small>(선택)</small></span>
                <input
                  type="text"
                  value={genderOther}
                  onChange={(event) => setGenderOther(event.target.value)}
                  maxLength={40}
                  placeholder="직접 입력해 주세요"
                />
              </label>
            )}
          </fieldset>

          <p className={`intro-message ${formMessage ? "visible" : ""}`} role="alert">
            {formMessage || "이름과 연락처는 수집하지 않습니다."}
          </p>
          <button className="primary-button start-button" type="button" onClick={startSurvey}>
            {survey ? `${survey.label} 맞춤 설문 시작` : "연령대를 선택해 주세요"}
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </main>

      <footer className="site-footer">
        <p>대한예수교장로회 재건총회신학원</p>
        <p>응답 내용은 모집·교육·장학·진로지원 개선에만 사용됩니다.</p>
      </footer>
      {qrOpen && <SurveyQrDialog url={surveyUrl} onClose={() => setQrOpen(false)} />}
    </div>
  );
}
