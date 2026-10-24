"use client";

import { useState } from "react";
import { BirthForm } from "@/components/story/BirthForm";
import type { BirthProfile } from "@/lib/db/types";

export function BirthFormPreview() {
  const [result, setResult] = useState<BirthProfile | null>(null);

  return (
    <div className="flex w-full flex-col gap-space-lg py-space-lg">
      <BirthForm title="아이의 생년월일시를 알려 주세요" onSubmit={setResult} onSkip={() => setResult(null)} />
      {result && (
        <pre className="overflow-x-auto rounded-xl bg-surface-container p-space-md font-body-sm text-body-sm text-on-surface-variant">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
