"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ProductFormInput, SaveResult } from "@/lib/admin/products";

/** z.coerce.number() 의 입력 타입은 unknown 이라, 화면에 채울 때만 숫자로 좁힌다 */
const num = (value: unknown) => (typeof value === "number" || typeof value === "string" ? value : "");

const FIELD =
  "w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-sm py-2.5 font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/60";

interface Option {
  value: string;
  label: string;
}

export interface ProductFormProps {
  action: (previous: SaveResult | null, formData: FormData) => Promise<SaveResult>;
  initial: ProductFormInput | null;
  /** 코드에 적힌 상품은 주소를 바꾸지 못한다 — 바꾸면 기존 구매 기록과 끊긴다 */
  lockSlug: boolean;
  options: { categories: Option[]; guides: Option[]; partners: Option[]; covers: Option[]; topics: Option[] };
}

export function ProductForm({ action, initial, lockSlug, options }: ProductFormProps) {
  const [state, formAction] = useFormState(action, null);
  const error = (key: string) => state?.errors?.[key];

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-space-lg">
      {state?.message && (
        <p role="alert" className="rounded-lg bg-error-container/30 p-space-md font-body-sm text-body-sm text-on-surface">
          {state.message}
        </p>
      )}

      <Field label="주소 (slug)" hint="상품 페이지 주소에 쓰입니다. 영문 소문자·숫자·하이픈." error={error("slug")}>
        <input
          name="slug"
          defaultValue={initial?.slug ?? ""}
          readOnly={lockSlug}
          required
          className={`${FIELD} ${lockSlug ? "opacity-60" : ""}`}
        />
        {lockSlug && <input type="hidden" name="slug" value={initial?.slug ?? ""} />}
      </Field>

      <Field label="상품 이름" error={error("title")}>
        <input name="title" defaultValue={initial?.title ?? ""} required className={FIELD} />
      </Field>

      <Field label="설명" hint="카드와 상세 화면에 보이는 한두 문장." error={error("description")}>
        <textarea name="description" defaultValue={initial?.description ?? ""} rows={3} required className={FIELD} />
      </Field>

      <div className="grid grid-cols-2 gap-space-md">
        <Field label="판매가 (원)" error={error("price")}>
          <input name="price" type="number" defaultValue={num(initial?.price)} required min={100} className={FIELD} />
        </Field>
        <Field label="할인 전 가격 (원)" hint="비워 두면 할인 표시를 하지 않습니다." error={error("originalPrice")}>
          <input name="originalPrice" type="number" defaultValue={num(initial?.originalPrice)} className={FIELD} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-space-md">
        <Field label="분류" error={error("category")}>
          <Select name="category" options={options.categories} value={initial?.category} />
        </Field>
        <Field label="배지 문구" hint="비워 두면 분류 이름을 씁니다." error={error("categoryLabel")}>
          <input name="categoryLabel" defaultValue={initial?.categoryLabel ?? ""} className={FIELD} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-space-md">
        <Field label="안내자" error={error("guide")}>
          <Select name="guide" options={options.guides} value={initial?.guide} />
        </Field>
        <Field label="상대방 정보" error={error("partner")}>
          <Select name="partner" options={options.partners} value={initial?.partner} />
        </Field>
      </div>

      <Field label="표지 이미지" error={error("cover")}>
        <Select name="cover" options={options.covers} value={initial?.cover} />
      </Field>

      <Field label="쓰는 명식 토픽" hint="고른 토픽을 모두 계산해 풀이에 넣습니다. 많을수록 생성이 오래 걸려요." error={error("topics")}>
        <div className="flex flex-wrap gap-space-xs">
          {options.topics.map((topic) => (
            <label
              key={topic.value}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-space-sm py-1.5 font-label-sm text-label-sm text-on-surface-variant"
            >
              <input
                type="checkbox"
                name="topics"
                value={topic.value}
                defaultChecked={initial?.topics?.includes(topic.value as never)}
                className="accent-primary"
              />
              {topic.label}
            </label>
          ))}
        </div>
      </Field>

      <Field label="보고서 목차" hint="한 줄에 한 장. AI 가 이 순서와 제목으로 씁니다." error={error("chapters")}>
        <textarea name="chapters" defaultValue={initial?.chapters ?? ""} rows={8} required className={FIELD} />
      </Field>

      <Field label="고지 문구" hint="비워 둬도 됩니다. 적으면 화면과 풀이 끝에 반드시 붙습니다." error={error("disclaimer")}>
        <input name="disclaimer" defaultValue={initial?.disclaimer ?? ""} className={FIELD} />
      </Field>

      <label className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} className="accent-primary" />
        판매 중 (끄면 첫 화면과 검색에서 사라집니다)
      </label>

      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-lg bg-on-surface px-space-lg py-3 font-label-md text-label-md text-surface disabled:opacity-60"
    >
      {pending ? "저장하는 중…" : "저장"}
    </button>
  );
}

function Field({
  label, hint, error, children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-md text-label-md text-on-surface">{label}</span>
      {hint && <span className="font-label-sm text-label-sm text-outline">{hint}</span>}
      {children}
      {error && <span className="font-label-sm text-label-sm text-error">{error}</span>}
    </label>
  );
}

function Select({ name, options, value }: { name: string; options: Option[]; value?: string }) {
  return (
    <select name={name} defaultValue={value} className={FIELD}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
