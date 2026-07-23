# RE:START 청년 인식조사

재건총회신학원의 20대·30대 맞춤형 모바일 설문입니다. 연령대에 따라 문항이 자동으로 달라지며, 성별 선택, 진행률, 복수 선택, 익명 제출, QR 공유를 지원합니다.

## Vercel 배포

1. Vercel에서 이 GitHub 저장소를 Import합니다.
2. **Framework Preset**은 `Next.js`를 선택합니다.
3. Vercel Marketplace에서 **Neon**을 설치하고 프로젝트에 연결합니다.
4. Neon이 생성한 `DATABASE_URL` 환경변수가 연결되었는지 확인합니다.
5. Vercel 프로젝트의 Environment Variables에 긴 관리자 비밀번호를
   `EXPORT_SECRET`으로 추가합니다.
6. Deploy를 실행합니다.

별도의 Build/Output 설정은 필요하지 않습니다. Vercel이 다음 설정을 자동으로 사용합니다.

- Build Command: `npm run build`
- Framework: Next.js
- Node.js: 22.x

Neon 연결 후 첫 응답이 제출될 때 `survey_responses` 테이블과 조회용 인덱스가 자동 생성됩니다. 직접 생성하려면 [`db/schema.sql`](db/schema.sql)을 Neon SQL Editor에서 실행할 수 있습니다.

## 전체 결과 내려받기

배포 주소 뒤에 `/results`를 붙여 관리자 결과 페이지를 엽니다.

```text
https://your-project.vercel.app/results
```

Vercel에 설정한 `EXPORT_SECRET`을 입력하면 전체 설문 결과를 CSV 또는 Excel
형태로 내려받을 수 있습니다. Excel 파일에는 `전체 응답`, `20대`, `30대` 시트가
포함됩니다. 비밀번호는 URL이나 브라우저 저장소에 남기지 않으며 결과 조회 API는
캐시하지 않습니다.

## 분석 리포트

`/report`에서는 동일한 `EXPORT_SECRET`으로 전체 응답 분석을 확인할 수 있습니다.
전체·연령·성별 분포, 최근 14일 응답 추이, 5점 척도 평균, 선택형 문항 순위와
초기 인사이트를 실시간으로 집계합니다. 원본 응답 대신 집계 결과만 브라우저로
전달됩니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local`의 `DATABASE_URL`에 Neon Postgres 연결 문자열을 입력해야 실제 응답 제출을 시험할 수 있습니다. 환경변수가 없어도 화면 빌드는 정상적으로 완료됩니다.

## 주요 명령

- `npm run dev`: 개발 서버 실행
- `npm run build`: Vercel용 Next.js 프로덕션 빌드
- `npm run lint`: 코드 검사
- `npm test`: 빌드와 배포 구성 검사

응답에는 이름, 연락처, IP, 사용자 에이전트를 저장하지 않습니다.
