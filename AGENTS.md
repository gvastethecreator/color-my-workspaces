# Color My Workspaces

VS Code / Cursor extension (`gvastethecreator.color-my-workspaces`). pnpm. TypeScript in `src/`. esbuild writes `dist/extension.js`.

## Commands

- Install: `pnpm install`
- Test: `pnpm test`
- Types: `pnpm run check-types`
- Compile: `pnpm run compile`
- Watch: `pnpm run watch`
- Production bundle: `pnpm run package`
- Icons from SVG: `pnpm run icons`
- VSIX: `pnpm run vsix`

F5 (`Run Extension`) compiles, then opens `test-workspace/` so chrome colors do not land in this repo.

## Rules

- Package manager is pnpm. Do not switch to npm or yarn.
- Product UI strings stay English. Operator chat may be Spanish.
- This extension colors VS Code chrome via `workbench.colorCustomizations`. It cannot color the Windows taskbar.
- Theme keys: `titleBar.*`, `activityBar.*`, `activityBarTop.*`, `statusBar.*`, `commandCenter.*`. Modern UI uses `titleBar` as the window-shell backdrop. Activity bar on top or bottom needs `activityBarTop`.
- Do not commit `.vscode/settings.json` in this repo. It is operator chrome from testing the extension.
- Do not write tickets under `docs/`. Local tickets: `.scratch/workspace-color/issues/`.
- Logs belong in `logs/`. Do not dump logs at the repo root.
- Do not commit, push, or rewrite git history unless the user asks.

## Layout

- `src/extension.ts` — activate, persist, panel messages, status bar
- `src/quickActions.ts` — palette and status Quick Picks
- `src/statusDisplay.ts` — status bar text and tooltip
- `src/chrome.ts` — theme-token map
- `src/panel.ts` — settings webview (English)
- `src/color.ts`, `src/palette.ts`, `src/identity.ts`, `src/icons.ts`, `src/merge.ts`, `src/panelState.ts`
- `src/*.test.ts` — Node test runner
- `test-workspace/` — Extension Host folder
- `docs/codemap/` — generated map; refresh with `$maintain-code-map`
