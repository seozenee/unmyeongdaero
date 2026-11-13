import nodeModule from "node:module";
import path from "node:path";

// App Router compiles JSX with its own React. The external PDF renderer uses
// the installed React peer, so construct every PDF element with that runtime.
const makeRequire = nodeModule.createRequire;
const nodeRequire = makeRequire(path.join(process.cwd(), "package.json"));
const runtime = nodeRequire("react/jsx-runtime") as typeof import("react/jsx-runtime");
export const { jsx, jsxs, Fragment } = runtime;
export type { JSX } from "react/jsx-runtime";
