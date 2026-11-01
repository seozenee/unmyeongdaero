"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

/** 상품명·조건은 현재 문서에서 받는다. 이전 RSC의 상세 상품 데이터를 재사용하지 않는다. */
export const ProductLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(function ProductLink(props, ref) {
  return <a {...props} ref={ref} />;
});
