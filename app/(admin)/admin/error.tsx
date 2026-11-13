"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="admin-panel admin-empty">
    <p>운영 데이터를 불러오지 못했어요.</p>
    <button className="admin-button" type="button" onClick={reset}>다시 불러오기</button>
  </section>;
}
