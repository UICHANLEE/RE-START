"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Cohort = "20s" | "30s";

interface BreakdownItem {
  label: string;
  count: number;
  percent: number;
}

interface ScaleQuestion {
  cohort: Cohort;
  id: string;
  number: number;
  prompt: string;
  responses: number;
  average: number;
  distribution: Array<{ value: number; count: number; percent: number }>;
}

interface ChoiceQuestion {
  cohort: Cohort;
  id: string;
  number: number;
  prompt: string;
  type: "single" | "multi";
  responses: number;
  options: BreakdownItem[];
}

interface TextQuestion {
  cohort: Cohort;
  id: string;
  number: number;
  prompt: string;
  responses: number;
  keywords: Array<{ term: string; count: number; percent: number }>;
}

interface ReportData {
  generatedAt: string;
  lastSubmittedAt: string | null;
  total: number;
  cohorts: BreakdownItem[];
  ages: BreakdownItem[];
  genders: BreakdownItem[];
  daily: Array<{ date: string; label: string; count: number }>;
  scaleQuestions: ScaleQuestion[];
  choiceQuestions: ChoiceQuestion[];
  textQuestions: TextQuestion[];
  insights: string[];
}

function BarList({ items, color = "blue" }: { items: BreakdownItem[]; color?: "blue" | "clay" }) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="report-bars">
      {items.map((item) => (
        <div className="report-bar-row" key={item.label}>
          <div className="report-bar-label">
            <span>{item.label}</span>
            <strong>{item.count}명 · {item.percent}%</strong>
          </div>
          <div className="report-bar-track" aria-hidden="true">
            <span
              className={color === "clay" ? "is-clay" : ""}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: ReportData["daily"] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const y = 44 - (item.count / max) * 38;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div className="trend-chart">
      <svg viewBox="0 0 100 48" role="img" aria-label="최근 14일 일별 응답 추이">
        <line x1="0" y1="44" x2="100" y2="44" className="trend-grid" />
        <polyline points={points} className="trend-line" />
        {data.map((item, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          const y = 44 - (item.count / max) * 38;
          return (
            <circle key={item.date} cx={x} cy={y} r="1.5">
              <title>{item.date}: {item.count}명</title>
            </circle>
          );
        })}
      </svg>
      <div className="trend-labels">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}

function LikertChart({ question }: { question: ScaleQuestion }) {
  const percent = (value: number) =>
    question.distribution.find((item) => item.value === value)?.percent ?? 0;
  const veryNegative = percent(1);
  const negative = percent(2);
  const neutral = percent(3);
  const positive = percent(4);
  const veryPositive = percent(5);
  const negativeTotal = veryNegative + negative;
  const positiveTotal = positive + veryPositive;
  const sideMax = Math.max(negativeTotal, positiveTotal, 1);

  return (
    <div className="likert-row">
      <div className="likert-question">
        <b>Q{question.number}</b>
        <span>{question.prompt}</span>
        <strong>{question.average.toFixed(2)}</strong>
      </div>
      <div className="likert-values">
        <span>부정 {negativeTotal.toFixed(0)}%</span>
        <span>중립 {neutral.toFixed(0)}%</span>
        <span>긍정 {positiveTotal.toFixed(0)}%</span>
      </div>
      <div
        className="likert-diverging"
        style={{ gridTemplateColumns: `1fr ${Math.max(neutral, 2)}% 1fr` }}
        aria-label={`매우 불만족 ${veryNegative.toFixed(0)}%, 조금 불만족 ${negative.toFixed(0)}%, 보통 ${neutral.toFixed(0)}%, 조금 만족 ${positive.toFixed(0)}%, 매우 만족 ${veryPositive.toFixed(0)}%`}
      >
        <div className="likert-negative">
          <span
            className="likert-very-negative"
            style={{ width: `${(veryNegative / sideMax) * 100}%` }}
            title={`1점 매우 불만족 ${veryNegative.toFixed(0)}%`}
          />
          <span
            className="likert-some-negative"
            style={{ width: `${(negative / sideMax) * 100}%` }}
            title={`2점 조금 불만족 ${negative.toFixed(0)}%`}
          />
        </div>
        <div className="likert-neutral" title={`3점 보통 ${neutral.toFixed(0)}%`}>
          <span className="sr-only">보통 {neutral.toFixed(0)}%</span>
        </div>
        <div className="likert-positive">
          <span
            className="likert-some-positive"
            style={{ width: `${(positive / sideMax) * 100}%` }}
            title={`4점 조금 만족 ${positive.toFixed(0)}%`}
          />
          <span
            className="likert-very-positive"
            style={{ width: `${(veryPositive / sideMax) * 100}%` }}
            title={`5점 매우 만족 ${veryPositive.toFixed(0)}%`}
          />
        </div>
      </div>
    </div>
  );
}

function WordCloud({ question }: { question: TextQuestion }) {
  const max = Math.max(1, ...question.keywords.map((keyword) => keyword.count));
  const min = Math.min(max, ...question.keywords.map((keyword) => keyword.count));
  const size = (count: number) => {
    const ratio = max === min ? 0.58 : (count - min) / (max - min);
    return `${1 + ratio * 1.5}rem`;
  };

  return (
    <article className="report-panel wordcloud-panel">
      <div className="wordcloud-heading">
        <div>
          <span>Q{question.number} · 서술형 {question.responses}건</span>
          <h3>{question.prompt}</h3>
        </div>
        <small>2명 이상 공통 사용어</small>
      </div>
      {question.keywords.length ? (
        <>
          <div className="wordcloud" aria-label="서술형 답변 워드클라우드">
            {question.keywords.map((keyword, index) => (
              <span
                className={`word-tone-${index % 5}`}
                key={keyword.term}
                style={{ fontSize: size(keyword.count) }}
                title={`${keyword.term}: ${keyword.count}명 (${keyword.percent}%)`}
              >
                {keyword.term}
              </span>
            ))}
          </div>
          <div className="keyword-ranking">
            {question.keywords.slice(0, 8).map((keyword, index) => (
              <div key={keyword.term}>
                <b>{index + 1}</b>
                <span>{keyword.term}</span>
                <strong>{keyword.count}명 · {keyword.percent}%</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="wordcloud-empty">
          공통 키워드를 만들 수 있는 유효 응답이 아직 없습니다.
        </div>
      )}
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) return "응답 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export default function ReportPage() {
  const [secret, setSecret] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [cohort, setCohort] = useState<Cohort>("20s");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cohortScales = useMemo(
    () => report?.scaleQuestions.filter((question) => question.cohort === cohort) ?? [],
    [report, cohort],
  );
  const cohortChoices = useMemo(
    () => report?.choiceQuestions.filter((question) => question.cohort === cohort) ?? [],
    [report, cohort],
  );
  const cohortTexts = useMemo(
    () => report?.textQuestions.filter((question) => question.cohort === cohort) ?? [],
    [report, cohort],
  );

  async function loadReport() {
    if (!secret) {
      setError("보고서 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const body = (await response.json()) as ReportData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "보고서를 불러오지 못했습니다.");
      setReport(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "보고서를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <main className="report-login-shell">
        <section className="report-login-card" aria-labelledby="report-login-title">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">R</span>
            <span><strong>RE:START</strong><small>청년 인식조사 분석</small></span>
          </div>
          <p className="results-eyebrow">관리자 리포트</p>
          <h1 id="report-login-title">설문 결과를 한눈에</h1>
          <p>전체 응답을 집계해 분포, 평균, 주요 선택과 초기 인사이트를 시각화합니다.</p>
          <label className="results-secret">
            <span>보고서 비밀번호</span>
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !loading) void loadReport();
              }}
              autoComplete="current-password"
              placeholder="EXPORT_SECRET"
            />
          </label>
          <button className="report-load-button" type="button" onClick={() => void loadReport()} disabled={loading}>
            {loading ? "분석 중…" : "분석 리포트 열기"}
          </button>
          <p className="results-message" aria-live="polite">{error}</p>
          <div className="report-login-links">
            <Link href="/results">결과 파일 내보내기</Link>
            <Link href="/">설문으로 돌아가기</Link>
          </div>
        </section>
      </main>
    );
  }

  const twenties = report.cohorts.find((item) => item.label === "20대")?.count ?? 0;
  const thirties = report.cohorts.find((item) => item.label === "30대")?.count ?? 0;
  const maxDaily = Math.max(0, ...report.daily.map((item) => item.count));

  return (
    <main className="report-shell">
      <header className="report-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span><strong>RE:START</strong><small>청년 인식조사 분석</small></span>
        </div>
        <nav>
          <Link href="/results">CSV·Excel</Link>
          <button type="button" onClick={() => void loadReport()} disabled={loading}>
            {loading ? "새로고침 중…" : "데이터 새로고침"}
          </button>
        </nav>
      </header>

      <div className="report-content">
        <section className="report-hero">
          <div>
            <p>재건총회신학원 청년 인식조사</p>
            <h1>응답 분석 리포트</h1>
            <span>마지막 응답 {formatDate(report.lastSubmittedAt)} · 실시간 집계</span>
          </div>
          <div className="report-status"><i /> 데이터 연결됨</div>
        </section>

        <section className="report-kpis" aria-label="핵심 지표">
          <article><span>전체 응답</span><strong>{report.total}</strong><small>누적 제출 인원</small></article>
          <article><span>20대 응답</span><strong>{twenties}</strong><small>전체의 {report.total ? Math.round((twenties / report.total) * 100) : 0}%</small></article>
          <article><span>30대 응답</span><strong>{thirties}</strong><small>전체의 {report.total ? Math.round((thirties / report.total) * 100) : 0}%</small></article>
          <article><span>일 최고 응답</span><strong>{maxDaily}</strong><small>최근 14일 기준</small></article>
        </section>

        <section className="report-grid report-overview">
          <article className="report-panel report-trend-panel">
            <div className="report-panel-heading">
              <div><span>응답 흐름</span><h2>최근 14일 참여 추이</h2></div>
              <strong>{report.daily.reduce((sum, item) => sum + item.count, 0)}명</strong>
            </div>
            <TrendChart data={report.daily} />
          </article>
          <article className="report-panel">
            <div className="report-panel-heading"><div><span>응답자 구성</span><h2>연령대 분포</h2></div></div>
            <BarList items={report.ages} />
          </article>
          <article className="report-panel">
            <div className="report-panel-heading"><div><span>응답자 구성</span><h2>성별 분포</h2></div></div>
            <BarList items={report.genders} color="clay" />
          </article>
        </section>

        <section className="report-insights">
          <div className="report-section-title"><span>자동 분석</span><h2>현재 응답에서 보이는 신호</h2></div>
          <div className="insight-grid">
            {report.insights.map((insight, index) => (
              <article key={insight}><b>{String(index + 1).padStart(2, "0")}</b><p>{insight}</p></article>
            ))}
          </div>
        </section>

        <section className="report-deep-dive">
          <div className="report-deep-heading">
            <div className="report-section-title"><span>연령별 상세</span><h2>문항 분석</h2></div>
            <div className="report-tabs" role="tablist" aria-label="연령대 선택">
              {(["20s", "30s"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={cohort === value}
                  onClick={() => setCohort(value)}
                >
                  {value === "20s" ? "20대" : "30대"}
                </button>
              ))}
            </div>
          </div>

          <article className="report-panel scale-panel">
            <div className="report-panel-heading">
              <div><span>5점 척도</span><h2>긍정·부정 응답 분포</h2></div>
              <small>부정 1·2점 · 중립 3점 · 긍정 4·5점 · 우측 숫자는 평균</small>
            </div>
            <div className="likert-legend" aria-label="5점 척도 색상 범례">
              <span className="legend-very-negative">매우 불만족</span>
              <span className="legend-some-negative">조금 불만족</span>
              <span className="legend-neutral">보통</span>
              <span className="legend-some-positive">조금 만족</span>
              <span className="legend-very-positive">매우 만족</span>
            </div>
            <div className="likert-list">
              {cohortScales.map((question) => (
                <LikertChart question={question} key={`${question.cohort}-${question.id}`} />
              ))}
            </div>
          </article>

          <div className="choice-report-grid">
            {cohortChoices.map((question) => (
              <article className="report-panel choice-panel" key={`${question.cohort}-${question.id}`}>
                <div className="choice-title">
                  <span>Q{question.number}{question.type === "multi" ? " · 복수선택" : ""}</span>
                  <h3>{question.prompt}</h3>
                </div>
                <BarList items={question.options.slice(0, 6)} color={cohort === "30s" ? "clay" : "blue"} />
              </article>
            ))}
          </div>

          <section className="report-text-analysis">
            <div className="report-section-title">
              <span>서술형 분석</span>
              <h2>문항별 공통 키워드</h2>
              <p>원문은 표시하지 않으며, 개인 표현 노출을 줄이기 위해 2명 이상이 함께 사용한 단어만 집계합니다.</p>
            </div>
            <div className="wordcloud-grid">
              {cohortTexts.map((question) => (
                <WordCloud question={question} key={`${question.cohort}-${question.id}`} />
              ))}
            </div>
          </section>
        </section>

        <footer className="report-footer">
          <p>응답 데이터는 Neon에서 실시간 집계되며 이름·연락처·IP는 수집하지 않습니다.</p>
          <span>생성 {formatDate(report.generatedAt)}</span>
        </footer>
      </div>
    </main>
  );
}
