export type Cohort = "20s" | "30s";

export type AnswerValue = string | number | string[];

export type QuestionType = "single" | "multi" | "scale" | "text";

export interface SurveyOption {
  value: string | number;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  number: number;
  type: QuestionType;
  prompt: string;
  options?: readonly SurveyOption[];
  required?: boolean;
  help?: string;
  maxLength?: number;
}

export interface SurveyDefinition {
  cohort: Cohort;
  label: string;
  subtitle: string;
  invitation: string;
  questions: readonly SurveyQuestion[];
}

export const SURVEY_VERSION = "2026-07-23-v1";
export const SURVEY_TOTAL_QUESTIONS = 20;

export const AGE_OPTIONS = [
  { value: "20-24", label: "20~24세", cohort: "20s" },
  { value: "25-29", label: "25~29세", cohort: "20s" },
  { value: "30-34", label: "30~34세", cohort: "30s" },
  { value: "35-39", label: "35~39세", cohort: "30s" },
] as const;

export const GENDER_OPTIONS = ["남성", "여성", "기타", "응답하지 않음"] as const;

const agreementScale: readonly SurveyOption[] = [
  { value: 1, label: "전혀 그렇지 않다" },
  { value: 2, label: "그렇지 않다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
];

const possibilityOptions: readonly SurveyOption[] = [
  { value: "전혀 없음", label: "전혀 없음" },
  { value: "낮음", label: "낮음" },
  { value: "보통", label: "보통" },
  { value: "높음", label: "높음" },
  { value: "매우 높음", label: "매우 높음" },
];

const twentiesQuestions: readonly SurveyQuestion[] = [
  {
    id: "q2",
    number: 2,
    type: "single",
    prompt: "현재 주된 상태는 무엇입니까?",
    options: ["대학생", "취업준비", "직장인", "교회 사역자", "기타"].map(
      (label) => ({ value: label, label }),
    ),
    required: true,
  },
  {
    id: "q3",
    number: 3,
    type: "scale",
    prompt: "나는 신앙과 삶의 방향을 더 깊이 배우고 싶다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q4",
    number: 4,
    type: "scale",
    prompt: "성경을 체계적으로 공부할 필요를 느낀다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q5",
    number: 5,
    type: "scale",
    prompt: "하나님의 부르심이나 나의 사명을 진지하게 고민해 본 적이 있다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q6",
    number: 6,
    type: "single",
    prompt: "신학 공부를 생각할 때 가장 먼저 떠오르는 이미지는 무엇입니까?",
    options: [
      "목회자 준비",
      "성경 전문교육",
      "신앙 성장",
      "어렵고 부담스러운 공부",
      "진로가 제한됨",
      "잘 모르겠다",
    ].map((label) => ({ value: label, label })),
    required: true,
  },
  {
    id: "q7",
    number: 7,
    type: "scale",
    prompt: "신학 공부는 목회자가 되려는 사람에게만 필요하다고 생각한다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q8",
    number: 8,
    type: "multi",
    prompt: "신학원 진학을 주저하게 만드는 요인은 무엇입니까?",
    options: [
      "등록금",
      "진로 불확실",
      "학업 난이도",
      "시간 부족",
      "가족 반대",
      "교단·학교 정보 부족",
      "관심 없음",
    ].map((label) => ({ value: label, label })),
    required: true,
    help: "해당하는 항목을 모두 선택해 주세요.",
  },
  {
    id: "q9",
    number: 9,
    type: "multi",
    prompt: "신학원에 관심을 갖게 할 수 있는 요소는 무엇입니까?",
    options: [
      "장학금",
      "주말·야간수업",
      "온라인 병행",
      "진로상담",
      "청년 멘토링",
      "성경원어 교육",
      "실습 중심 교육",
    ].map((label) => ({ value: label, label })),
    required: true,
    help: "해당하는 항목을 모두 선택해 주세요.",
  },
  {
    id: "q10",
    number: 10,
    type: "scale",
    prompt: "재건총회신학원이 어떤 곳인지 충분히 알고 있다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q11",
    number: 11,
    type: "single",
    prompt: "신학원 정보를 주로 어디에서 얻고 싶습니까?",
    options: [
      "인스타그램·유튜브",
      "교회 목회자",
      "선배·친구",
      "수련회 설명회",
      "학교 홈페이지",
      "카카오톡 채널",
    ].map((label) => ({ value: label, label })),
    required: true,
  },
  {
    id: "q12",
    number: 12,
    type: "scale",
    prompt: "재학생의 실제 경험담이나 하루 생활 영상을 보면 관심이 높아질 것 같다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q13",
    number: 13,
    type: "single",
    prompt: "관심 있는 교육내용은 무엇입니까?",
    options: [
      "성경과 원어",
      "설교와 목회",
      "상담과 청년사역",
      "찬양·미디어",
      "선교·전도",
      "기독교교육",
      "신학 기초",
    ].map((label) => ({ value: label, label })),
    required: true,
  },
  {
    id: "q14",
    number: 14,
    type: "scale",
    prompt: "학위·자격보다 실제 사역역량을 키워 주는 교육이 중요하다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q15",
    number: 15,
    type: "single",
    prompt: "선호하는 수업방식은 무엇입니까?",
    options: ["평일 주간", "평일 야간", "토요일 집중", "온라인 병행", "방학 집중과정"].map(
      (label) => ({ value: label, label }),
    ),
    required: true,
  },
  {
    id: "q16",
    number: 16,
    type: "scale",
    prompt: "1일 신학원 체험, 공개강의 또는 캠퍼스 투어에 참여할 의향이 있다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q17",
    number: 17,
    type: "single",
    prompt: "장학혜택이 충분하다면 진학 검토 가능성은 어떻게 됩니까?",
    options: ["매우 높아짐", "조금 높아짐", "변화 없음", "잘 모르겠다"].map(
      (label) => ({ value: label, label }),
    ),
    required: true,
  },
  {
    id: "q18",
    number: 18,
    type: "single",
    prompt: "앞으로 2년 안에 신학 공부를 시작할 가능성은 어느 정도입니까?",
    options: possibilityOptions,
    required: true,
  },
  {
    id: "q19",
    number: 19,
    type: "multi",
    prompt: "신학원이 청년에게 제공했으면 하는 지원은 무엇입니까?",
    options: [
      "진로설계",
      "생활·등록금 장학",
      "취업·사역 연계",
      "멘토링",
      "기숙사·통학지원",
      "심리·영적 상담",
    ].map((label) => ({ value: label, label })),
    required: true,
    help: "해당하는 항목을 모두 선택해 주세요.",
  },
  {
    id: "q20",
    number: 20,
    type: "text",
    prompt:
      "재건총회신학원이 청년들에게 매력적인 학교가 되기 위해 가장 먼저 바꾸거나 강화해야 할 것은 무엇입니까?",
    required: false,
    help: "한 문장만 적어도 좋습니다. (선택)",
    maxLength: 800,
  },
];

const thirtiesQuestions: readonly SurveyQuestion[] = [
  {
    id: "q2",
    number: 2,
    type: "single",
    prompt: "현재 주된 상태는 무엇입니까?",
    options: ["직장인", "자영업", "전임·파트 사역자", "육아·가사", "구직·전환준비", "기타"].map(
      (label) => ({ value: label, label }),
    ),
    required: true,
  },
  {
    id: "q3",
    number: 3,
    type: "scale",
    prompt: "현재의 직업·사역·가정생활 속에서 신학적 훈련의 필요를 느낀다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q4",
    number: 4,
    type: "scale",
    prompt: "성경을 체계적으로 배우면 현재의 삶과 사역에 실제 도움이 될 것 같다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q5",
    number: 5,
    type: "scale",
    prompt: "제2의 진로 또는 사역 전환을 생각해 본 적이 있다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q6",
    number: 6,
    type: "single",
    prompt: "신학 공부를 생각할 때 가장 큰 기대는 무엇입니까?",
    options: [
      "목회·사역 준비",
      "성경 이해 심화",
      "직업과 신앙 통합",
      "교회 봉사 전문성",
      "새로운 진로 탐색",
      "개인 신앙회복",
    ].map((label) => ({ value: label, label })),
    required: true,
  },
  {
    id: "q7",
    number: 7,
    type: "multi",
    prompt: "신학원 진학의 가장 큰 현실적 장애는 무엇입니까?",
    options: [
      "직장시간",
      "가정·육아",
      "등록금",
      "통학거리",
      "학업 부담",
      "배우자·가족 동의",
      "졸업 후 진로",
    ].map((label) => ({ value: label, label })),
    required: true,
    help: "해당하는 항목을 모두 선택해 주세요.",
  },
  {
    id: "q8",
    number: 8,
    type: "scale",
    prompt: "주말·야간·온라인을 조합한 유연한 과정이 있다면 진학 가능성이 높아진다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q9",
    number: 9,
    type: "scale",
    prompt: "등록금 분납이나 장학제도가 진학 결정에 큰 영향을 준다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q10",
    number: 10,
    type: "scale",
    prompt: "재건총회신학원의 교육과정과 진로에 대해 충분히 알고 있다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q11",
    number: 11,
    type: "single",
    prompt: "가장 필요한 과정 형태는 무엇입니까?",
    options: [
      "정규 학위과정",
      "비학위 성경과정",
      "목회·사역자 재교육",
      "직장인 야간과정",
      "온라인 인증과정",
      "단기 집중과정",
    ].map((label) => ({ value: label, label })),
    required: true,
  },
  {
    id: "q12",
    number: 12,
    type: "multi",
    prompt: "관심 있는 교육분야는 무엇입니까?",
    options: [
      "성경원어·주해",
      "설교와 목회",
      "상담·가정사역",
      "교회행정·리더십",
      "선교·전도",
      "다음세대교육",
      "평신도 신학",
    ].map((label) => ({ value: label, label })),
    required: true,
    help: "해당하는 항목을 모두 선택해 주세요.",
  },
  {
    id: "q13",
    number: 13,
    type: "scale",
    prompt: "현장 목회자와 전문가의 멘토링이 있으면 진학 의향이 높아진다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q14",
    number: 14,
    type: "scale",
    prompt: "졸업 후 교회·기관·선교 현장과 연결되는 진로지원이 중요하다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q15",
    number: 15,
    type: "single",
    prompt: "선호하는 수업시간은 무엇입니까?",
    options: ["평일 야간", "토요일", "주 1회 집중", "온라인 중심", "월 1~2회 집중"].map(
      (label) => ({ value: label, label }),
    ),
    required: true,
  },
  {
    id: "q16",
    number: 16,
    type: "single",
    prompt: "통학 가능한 수업 빈도는 어느 정도입니까?",
    options: ["주 2회 이상", "주 1회", "월 2회", "월 1회", "온라인만 가능"].map(
      (label) => ({ value: label, label }),
    ),
    required: true,
  },
  {
    id: "q17",
    number: 17,
    type: "scale",
    prompt: "배우자나 가족을 위한 설명회가 있다면 진학 결정에 도움이 될 것 같다.",
    options: agreementScale,
    required: true,
  },
  {
    id: "q18",
    number: 18,
    type: "single",
    prompt: "앞으로 3년 안에 신학 공부를 시작할 가능성은 어느 정도입니까?",
    options: possibilityOptions,
    required: true,
  },
  {
    id: "q19",
    number: 19,
    type: "multi",
    prompt: "신학원이 제공했으면 하는 실질적 지원은 무엇입니까?",
    options: [
      "직장인 장학",
      "육아·가족 배려",
      "온라인 수강",
      "기숙·통학 지원",
      "사역지 연계",
      "진로상담",
      "학습 튜터링",
    ].map((label) => ({ value: label, label })),
    required: true,
    help: "해당하는 항목을 모두 선택해 주세요.",
  },
  {
    id: "q20",
    number: 20,
    type: "text",
    prompt:
      "30대가 직장·가정과 병행하며 신학을 공부할 수 있도록 가장 필요한 변화나 지원은 무엇입니까?",
    required: false,
    help: "한 문장만 적어도 좋습니다. (선택)",
    maxLength: 800,
  },
];

export const SURVEYS: Record<Cohort, SurveyDefinition> = {
  "20s": {
    cohort: "20s",
    label: "20대",
    subtitle: "내 길과 부르심을 발견하는 신학 공부",
    invitation: "당신의 솔직한 답이 새로운 신학원을 만듭니다.",
    questions: twentiesQuestions,
  },
  "30s": {
    cohort: "30s",
    label: "30대",
    subtitle: "삶과 사역의 다음 단계를 준비하는 신학 공부",
    invitation: "직장·가정·사역을 함께 고려한 현실적인 의견을 들려주세요.",
    questions: thirtiesQuestions,
  },
};

export function cohortForAge(ageBand: string): Cohort | null {
  const match = AGE_OPTIONS.find((option) => option.value === ageBand);
  return match?.cohort ?? null;
}

export function sectionForQuestion(number: number): string {
  if (number <= 2) return "응답자 정보";
  if (number <= 10) return "신학 공부에 대한 생각";
  if (number <= 19) return "원하는 교육과 지원";
  return "마지막 한마디";
}
