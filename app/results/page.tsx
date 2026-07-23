"use client";

import Link from "next/link";
import { useState } from "react";

type ExportFormat = "csv" | "xlsx";

export default function ResultsPage() {
  const [secret, setSecret] = useState("");
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [message, setMessage] = useState("");

  async function download(format: ExportFormat) {
    if (!secret) {
      setMessage("내보내기 비밀번호를 입력해 주세요.");
      return;
    }

    setDownloading(format);
    setMessage("");
    try {
      const response = await fetch("/api/admin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, format }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "파일을 만들지 못했습니다.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ?? `restart-survey-results.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`${format === "csv" ? "CSV" : "Excel"} 파일을 내려받았습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "파일을 만들지 못했습니다.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main className="results-shell">
      <section className="results-card" aria-labelledby="results-title">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>
            <strong>RE:START</strong>
            <small>재건총회신학원 청년 인식조사</small>
          </span>
        </div>

        <p className="results-eyebrow">관리자 전용</p>
        <h1 id="results-title">전체 설문 결과 내보내기</h1>
        <p className="results-description">
          지금까지 제출된 모든 응답을 내려받습니다. Excel 파일은 전체 응답, 20대,
          30대 시트로 나뉘며 연령대별 실제 질문이 열 제목에 표시됩니다.
        </p>

        <label className="results-secret">
          <span>내보내기 비밀번호</span>
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !downloading) void download("xlsx");
            }}
            autoComplete="current-password"
            placeholder="Vercel에 설정한 EXPORT_SECRET"
          />
        </label>

        <div className="results-actions">
          <button type="button" onClick={() => void download("xlsx")} disabled={!!downloading}>
            {downloading === "xlsx" ? "Excel 생성 중…" : "Excel 파일 받기"}
          </button>
          <button type="button" onClick={() => void download("csv")} disabled={!!downloading}>
            {downloading === "csv" ? "CSV 생성 중…" : "CSV 파일 받기"}
          </button>
        </div>

        <p className="results-message" aria-live="polite">{message}</p>
        <p className="results-note">
          비밀번호는 브라우저에 저장되지 않습니다. 내려받은 파일에는 익명 설문 원본
          응답이 포함되므로 안전하게 관리해 주세요.
        </p>
        <div className="results-footer-links">
          <Link className="results-back" href="/report">분석 리포트 보기 →</Link>
          <Link className="results-back" href="/">← 설문으로 돌아가기</Link>
        </div>
      </section>
    </main>
  );
}
