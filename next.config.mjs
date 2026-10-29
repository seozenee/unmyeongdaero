// pdfkit 에서 람다에 함께 실어야 하는 파일. pnpm 은 실제 파일을 .pnpm 아래 버전 폴더에
// 두므로 glob 으로 집는다.
//
// `js/pdfkit.js` 가 목록의 첫 줄인 이유가 있다. pdfkit 의 package.json 은 진입점을
// 조건별로 둘로 나눠 둔다.
//
//   "." : { node: { import: "./js/pdfkit.node.mjs", require: "./js/pdfkit.js" } }
//
// Next 의 파일 추적은 `import` 쪽을 따라가 .mjs 만 챙겨 간다. 그런데 서버 번들은
// CommonJS 라서 런타임에는 `require` 쪽, 즉 `js/pdfkit.js` 를 집는다. 추적이 간 길과
// 실행이 가는 길이 엇갈려서, 번들에서 빼내고 서체까지 챙겨 넣어도 정작 본체가 없었다.
//
// 로컬에서는 node_modules 가 통째로 있어 드러나지 않는다. 서버리스에 올라간 뒤에만
// MODULE_NOT_FOUND 로 터지므로, 어긋났는지 빌드 때 확인한다(scripts/check-pdf-trace.mjs).
const PDFKIT_FILES = [
  "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/pdfkit.js",
  "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/output.cjs",
  "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/data/**",
  "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/standard-fonts/**",
];

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
    // 파일을 람다에 넣는 것만으로는 부족했다. 번들러가 pdfkit 을 통째로 묶어 버리면
    // 그 안의 require("./standard-fonts/Helvetica.cjs") 가 번들 기준으로 풀리기 때문에,
    // node_modules 에 파일이 있어도 못 찾는다.
    //
    // 그래서 아예 번들에서 빼낸다. 런타임에 node_modules 에서 그대로 require 되면
    // 상대경로가 원래대로 풀린다. 아래 추적 목록은 그 node_modules 가 람다에
    // 실려 가도록 보장하는 쪽이다 — 둘은 한 짝이다.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "pdfkit", "fontkit"],

    outputFileTracingIncludes: {
      // PDF 를 굽는 모든 길. 한 곳이라도 빠지면 그 길에서만 터진다.
      // (/v/[token] 은 보고서 화면으로 되돌려 보내기만 하므로 넣지 않는다)
      "/api/readings/[id]/pdf": PDFKIT_FILES,
      "/api/readings/[id]/generate": PDFKIT_FILES,
      "/r/[token]": PDFKIT_FILES,
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
