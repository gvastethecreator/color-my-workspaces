# Code map · vscode-workspace-color

generated: 2026-08-31T08:00:00Z
commit: 935b6e19bae2
scope: .

counts: 5 nodes · 5 edges · 0 flows · 0 unknown

## Modules

- `esbuild` · `esbuild.js` · interface · Esbuild
  callers: repository (calls)
  callees: external-dependencies (imports)
  tests: (none)
  entry: esbuild.js:main

- `external-dependencies` · `esbuild.js` · external · External
  callers: esbuild (imports), scripts (imports), src (imports)
  callees: (none)
  tests: (none)
  entry: esbuild.js:esbuild

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: esbuild (calls), scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls)
  callees: external-dependencies (imports)
  tests: (none)
  entry: scripts/render-icons.mjs:roundCorners

- `src` · `src` · module · Src
  callers: (none)
  callees: external-dependencies (imports)
  tests: src/chrome.test.ts, src/color.test.ts, src/icons.test.ts, src/identity.test.ts, src/merge.test.ts
  entry: src/chrome.ts:flagsToElements

## Edges

- esbuild -> external-dependencies · imports
- repository -> esbuild · calls
- repository -> scripts · calls
- scripts -> external-dependencies · imports
- src -> external-dependencies · imports

## Unknown

- none

## Flows

- none
