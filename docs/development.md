# Development

Package manager is pnpm (`packageManager: pnpm@12.1.0`). Do not switch to npm or yarn.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm install` | Install deps from `pnpm-lock.yaml` |
| `pnpm test` | Node test runner on `src/*.test.ts` |
| `pnpm run check-types` | `tsc --noEmit` |
| `pnpm run compile` | Types then esbuild → `dist/extension.js` |
| `pnpm run watch` | esbuild watch |
| `pnpm run package` | Production bundle |
| `pnpm run icons` | Rebuild marketplace icon, 512 raster, social preview, rounded panel shot |
| `pnpm run vsix` | Production bundle + `vsce package --no-dependencies` |

GitHub Actions runs `pnpm test` and `pnpm run check-types` on `main` and pull requests.

## Extension Host

`.vscode/launch.json` uses the default build task, then opens `test-workspace/` with `--extensionDevelopmentPath` set to this repo. Chrome colors from the running extension land in `test-workspace/.vscode/settings.json`, which is gitignored.

Do not apply Color My Workspaces to this repository folder if you want a clean git tree. `.vscode/settings.json` here is gitignored for that reason.

## Theme keys

`src/chrome.ts` maps surfaces to VS Code color customizations:

- Window shell: `titleBar.*`, `sash.hoverBorder`
- Activity bar: `activityBar.*` and `activityBarTop.*` (side vs top/bottom)
- Status bar: `statusBar.*` including remote-item keys
- Command center: `commandCenter.*`

Modern UI can force some bars transparent. **Disable Modern UI** in the panel writes `workbench.experimental.modernUI` to `false` and asks to reload.

Marketplace packaging and publish: [publishing](publishing.md).
