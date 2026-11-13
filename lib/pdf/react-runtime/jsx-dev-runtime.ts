import nodeModule from "node:module";
import path from "node:path";

const makeRequire = nodeModule.createRequire;
const nodeRequire = makeRequire(path.join(process.cwd(), "package.json"));
const runtime = nodeRequire("react/jsx-dev-runtime") as typeof import("react/jsx-dev-runtime");
export const { jsxDEV, Fragment } = runtime;
export type { JSX } from "react/jsx-runtime";
