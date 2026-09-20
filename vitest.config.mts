import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // server-only 는 react-server 조건 밖에서 import 하면 throw 하므로 테스트에서는 빈 모듈로 대체
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
  // tsconfig 의 jsx 는 "preserve" 다(Next 가 직접 변환하므로). vitest 는 그 설정을 그대로 따라
  // JSX 를 남겨 둔 채 파싱하다 실패하므로, 테스트에서만 변환하도록 일러 준다.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
});
