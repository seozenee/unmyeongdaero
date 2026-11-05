"use client";

import { useEffect, useRef } from "react";
import { CheckoutPanel } from "./CheckoutPanel";
import { purchaseOptions } from "@/lib/reports/catalog";
import { formatKRW } from "@/lib/format";

export function PurchaseSheet({ baseSlug, selectedSlug, name, readingId, preparedSlug, busy, freeIssue = false, onSelect, onPrepare, onClose }: {
  baseSlug: string; selectedSlug: string; name?: string; readingId: string | null; preparedSlug: string | null;
  busy: boolean; freeIssue?: boolean; onSelect: (slug: string) => void; onPrepare: (slug: string) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const bodyOverflow = useRef("");
  const leavingPage = useRef(false);
  useEffect(() => {
    const element = dialog.current; element?.showModal();
    bodyOverflow.current = document.body.style.overflow; document.body.style.overflow = "hidden";
    const hideBeforeSnapshot = () => {
      leavingPage.current = true;
      element?.close();
      document.body.style.overflow = bodyOverflow.current;
    };
    window.addEventListener("pagehide", hideBeforeSnapshot);
    return () => { window.removeEventListener("pagehide", hideBeforeSnapshot); element?.close(); document.body.style.overflow = bodyOverflow.current; };
  }, []);
  const hideForPayment = () => {
    dialog.current?.close();
    document.body.style.overflow = bodyOverflow.current;
  };
  const restoreAfterPayment = () => {
    const element = dialog.current;
    if (!leavingPage.current && element?.isConnected && !element.open) {
      element.showModal();
      document.body.style.overflow = "hidden";
    }
  };
  const options = purchaseOptions(baseSlug);
  const selected = options.find(option => option.slug === selectedSlug) ?? options[0]!;
  return <dialog ref={dialog} className="purchase-sheet" aria-label="구매 상품과 결제 선택" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if(event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="purchase-sheet-content">
      <div className="purchase-sheet-handle" aria-hidden />
      <header><div><p>{name ? `${name}님을 위한 구매 안내` : "나에게 맞는 풀이를 골라보세요"}</p><h2>함께 보면 더 좋은 묶음 혜택</h2></div><button type="button" onClick={onClose} disabled={busy} aria-label="구매창 닫기">×</button></header>
      <fieldset className="purchase-options"><legend className="sr-only">상품 선택</legend>{options.map(option => {
        const active = selected.slug === option.slug;
        const compareAtPrice = option.bundle?.compareAtPrice ?? option.originalPrice;
        const savings = option.bundle ? option.bundle.compareAtPrice - option.price : 0;
        return <label key={option.slug} className={`purchase-option${active ? " selected" : ""}`}>
          <input type="radio" name="purchase-option" checked={active} onChange={() => onSelect(option.slug)} disabled={busy} />
          <div className="purchase-option-main"><div><strong>{option.title}</strong>{option.bundle?.tier === "complete" && <span className="purchase-recommend">추천</span>}</div>
            {option.bundle && <p>{option.bundle.items.length}종 통합 리포트 · {formatKRW(savings)} 절약</p>}
            {option.bundle && <div className="purchase-tags">{option.bundle.items.map(slug => <span key={slug}>{purchaseOptions(slug)[0]!.title}</span>)}</div>}
          </div>
          <div className="purchase-option-price">{compareAtPrice && <><small>{option.bundle ? "단품 정상가 합계" : "정상가"}</small><del>{formatKRW(compareAtPrice)}</del></>}<div>{compareAtPrice && <span>-{Math.round((1-option.price/compareAtPrice)*100)}%</span>}<strong>{formatKRW(option.price)}</strong></div></div>
        </label>;
      })}</fieldset>
      <p className="purchase-sheet-note">{freeIssue ? "운영자 계정이라 어떤 상품을 골라도 결제 없이 열립니다." : "묶음에 표시된 모든 주제를 포함합니다. 자동 정기 결제 없이 한 번만 결제해요."}</p>
      <div className="purchase-sheet-footer">{readingId && preparedSlug === selected.slug
        ? <CheckoutPanel key={`${readingId}-${selected.slug}`} slug={selected.slug} readingId={readingId} price={selected.price} ctaLabel="바로 구매하기" compact freeIssue={freeIssue} onPaymentWindowOpen={hideForPayment} onPaymentWindowClose={restoreAfterPayment} />
        : <button type="button" className="purchase-sheet-continue" disabled={busy} onClick={() => onPrepare(selected.slug)}>{busy ? "풀이를 준비하고 있어요" : freeIssue ? "0원 · 운영자 무료 발급" : name ? `${formatKRW(selected.price)} · 구매 정보 확인` : "이 상품으로 사주 정보 입력"}</button>}
      </div>
    </div>
  </dialog>;
}
