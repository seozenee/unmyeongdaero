import type { ReportProduct } from "../reports/catalog";

export type IntakeId = "relationshipStatus" | "occupation" | "learningStage";
export interface IntakeQuestion { id: IntakeId; prompt: string; options: readonly { value: string; label: string }[] }
const RELATIONSHIP = [
  { value: "solo", label: "솔로예요" }, { value: "crush", label: "짝사랑·썸" },
  { value: "dating", label: "애인 있어요" }, { value: "reunion", label: "재회 원해요" },
  { value: "married", label: "결혼했어요" }, { value: "unspecified", label: "건너뛸게요" },
] as const;
const OCCUPATION = [
  { value: "student", label: "학생이에요" }, { value: "job_seeker", label: "구직 중이에요" },
  { value: "employee", label: "직장 다녀요" }, { value: "business", label: "사업해요" },
  { value: "freelance", label: "프리랜서예요" }, { value: "resting", label: "잠깐 쉬고 있어요" },
  { value: "unspecified", label: "건너뛸게요" },
] as const;
const LEARNING = [
  { value: "preschool", label: "아직 학교 가기 전이에요" }, { value: "elementary", label: "초등학교 다녀요" },
  { value: "middle", label: "중학교 다녀요" }, { value: "high", label: "고등학교 다녀요" },
  { value: "college", label: "대학·성인 학습이에요" }, { value: "exam", label: "시험 준비 중이에요" },
  { value: "unspecified", label: "건너뛸게요" },
] as const;

export function intakeQuestions(report: ReportProduct): IntakeQuestion[] {
  const blunt = report.guide === "gangho";
  if (report.roles?.subject === "child" || report.category === "study" || report.category === "child") {
    return [{ id: "learningStage", prompt: report.roles?.subject === "child" || report.roles?.partner === "child" ? "아이는 지금 어떤 배움의 시기에 있나요?" : "지금은 어떤 배움의 시기에 있나요?", options: LEARNING }];
  }
  const questions: IntakeQuestion[] = [];
  if (["destiny", "romance", "reunion", "chemistry", "year"].includes(report.category)) questions.push({
    id: "relationshipStatus", prompt: blunt ? "그래서, 연애는 지금 어때?" : "지금의 관계는 어떤 모습인가요?",
    options: RELATIONSHIP,
  });
  questions.push({ id: "occupation", prompt: blunt ? "지금은 무슨 일을 하고 있어?" : "요즘은 어떤 생활을 하고 계세요?", options: OCCUPATION });
  return questions;
}

/** 고객이 직접 고른 상황이다. 사주에서 알아낸 사실처럼 되돌려 말하지 않는다. */
export function intakeContext(answers: Record<string, string> = {}) {
  const find = (options: readonly { value: string; label: string }[], value?: string) =>
    value && value !== "unspecified" ? options.find(option => option.value === value)?.label : undefined;
  return {
    relationshipStatus: find(RELATIONSHIP, answers.relationshipStatus),
    occupation: find(OCCUPATION, answers.occupation),
    learningStage: find(LEARNING, answers.learningStage),
  };
}
