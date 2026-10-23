import { afterEach, describe, expect, it } from "vitest";
import { isAdmin } from "../access";
import type { AppUser } from "@/lib/auth/session";

const user = (email: string | null): AppUser => ({
  id: "u1", displayName: null, avatarUrl: null, provider: "email", email,
});

afterEach(() => {
  delete process.env.ADMIN_EMAILS;
});

describe("운영자 판별", () => {
  it("목록에 있는 이메일만 들어온다", () => {
    process.env.ADMIN_EMAILS = "owner@unmyeongdaero.com";
    expect(isAdmin(user("owner@unmyeongdaero.com"))).toBe(true);
    expect(isAdmin(user("someone@else.com"))).toBe(false);
  });

  it("대소문자와 앞뒤 공백은 무시한다", () => {
    process.env.ADMIN_EMAILS = " Owner@Unmyeongdaero.com , second@x.com ";
    expect(isAdmin(user("owner@unmyeongdaero.com"))).toBe(true);
    expect(isAdmin(user("SECOND@X.COM"))).toBe(true);
  });

  it("목록이 비어 있으면 아무도 못 들어온다 — 설정을 깜빡해도 전부 열리지 않는다", () => {
    expect(isAdmin(user("owner@unmyeongdaero.com"))).toBe(false);
    process.env.ADMIN_EMAILS = "";
    expect(isAdmin(user("owner@unmyeongdaero.com"))).toBe(false);
  });

  it("이메일이 없는 로그인(카카오 동의 미수신)은 막는다", () => {
    process.env.ADMIN_EMAILS = "owner@unmyeongdaero.com";
    expect(isAdmin(user(null))).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("빈 문자열이 목록에 섞여도 통과시키지 않는다", () => {
    process.env.ADMIN_EMAILS = "owner@x.com,,";
    expect(isAdmin(user(""))).toBe(false);
  });
});
