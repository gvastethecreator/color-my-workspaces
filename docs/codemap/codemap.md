# Code map · vscode-workspace-color

generated: 2026-08-30T20:30:00Z
commit: 9b391ac4ea3b
scope: .

counts: 4 nodes · 3 edges · 0 flows · 0 unknown

## Modules

- `esbuild` · `esbuild.js` · interface · Esbuild
  callers: repository (calls)
  callees: external-dependencies (imports)
  tests: (none)
  entry: esbuild.js:main

- `external-dependencies` · `esbuild.js` · external · External
  callers: esbuild (imports), src (imports)
  callees: (none)
  tests: (none)
  entry: esbuild.js:esbuild

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: esbuild (calls)
  tests: (none)
  entry: package.json:{

- `src` · `src` · module · Src
  callers: (none)
  callees: external-dependencies (imports)
  tests: src/chrome.test.ts, src/color.test.ts, src/identity.test.ts, src/merge.test.ts, src/panelState.test.ts
  entry: src/chrome.ts:flagsToElements

## Edges

- esbuild -> external-dependencies · imports
- repository -> esbuild · calls
- src -> external-dependencies · imports

## Unknown

- none

## Flows

- none
