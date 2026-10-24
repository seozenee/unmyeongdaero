import { notFound } from "next/navigation";
import { BirthFormPreview } from "./BirthFormPreview";

// 개발 환경 전용: 생년월일시 입력 폼만 따로 띄운다.
// 스토리 퍼널을 끝까지 눌러 가지 않고도 입력 UX 를 볼 수 있어야 고칠 수 있다.
export default function BirthFormDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BirthFormPreview />;
}
