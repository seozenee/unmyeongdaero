// pdfkit 의 표준 14서체. pnpm 은 실제 파일을 .pnpm 아래 버전 폴더에 두므로 glob 으로 집는다.
const PDFKIT_FONTS = "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/standard-fonts/**";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // PDF 는 @react-pdf/renderer → pdfkit 으로 그린다. pdfkit 은 표준 14서체(Helvetica 등)를
  // 런타임에 require 로 불러오는데, 경로가 코드에 문자열로 박혀 있지 않아 Next 의 파일
  // 추적이 이 파일들을 놓친다. 로컬에서는 node_modules 가 그대로 있어 드러나지 않고,
  // 서버리스로 올라간 뒤에야 MODULE_NOT_FOUND 로 터진다.
  //
  // 우리는 Pretendard 를 등록해 쓰지만, pdfkit 은 문서를 만들 때 Helvetica 를 기본 서체로
  // 먼저 잡기 때문에 이 파일들이 없으면 시작조차 못 한다.
  // (Next 14 에서는 experimental 아래에 있다. 15 에서 최상위로 올라간다.)
  experimental: {
    outputFileTracingIncludes: {
      // PDF 를 굽는 모든 길. 한 곳이라도 빠지면 그 길에서만 터진다.
      "/api/readings/[id]/pdf": [PDFKIT_FONTS],
      "/api/readings/[id]/generate": [PDFKIT_FONTS],
      "/r/[token]": [PDFKIT_FONTS],
      "/v/[token]": [PDFKIT_FONTS],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
