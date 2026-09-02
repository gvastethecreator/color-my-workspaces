# Code map · vscode-color-my-workspaces-pr1

generated: 2026-09-02T05:10:25Z
commit: c60684521a9d
scope: .

counts: 6 nodes · 7 edges · 0 flows · 0 unknown

## Modules

- `esbuild` · `esbuild.js` · interface · Esbuild
  callers: repository (calls)
  callees: external-dependencies (imports)
  tests: (none)
  entry: esbuild.js:createContext

- `external-dependencies` · `.vscode-test.mjs` · external · External
  callers: esbuild (imports), scripts (imports), src (imports), vscode-test (imports)
  callees: (none)
  tests: (none)
  entry: .vscode-test.mjs:@vscode/test-cli

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: esbuild (calls), scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls)
  callees: external-dependencies (imports), src (imports)
  tests: (none)
  entry: scripts/build-integration.mjs:import { build } from "esbuild";

- `src` · `src` · module · Src
  callers: scripts (imports)
  callees: external-dependencies (imports)
  tests: src/chrome.test.ts, src/color.test.ts, src/compatibility.test.ts, src/icons.test.ts, src/identity.test.ts
  entry: src/assets.d.ts:declare module "*.css";

- `vscode-test` · `.vscode-test` · module · .Vscode Test
  callers: (none)
  callees: external-dependencies (imports)
  tests: (none)
  entry: .vscode-test.mjs:workspaceFolder

## Edges

- esbuild -> external-dependencies · imports
- repository -> esbuild · calls
- repository -> scripts · calls
- scripts -> external-dependencies · imports
- scripts -> src · imports
- src -> external-dependencies · imports
- vscode-test -> external-dependencies · imports

## Unknown

- none

## Flows

- none
