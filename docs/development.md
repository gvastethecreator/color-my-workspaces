# Development

Package manager is pnpm (`packageManager: pnpm@12.0.0`). Do not switch to npm or yarn.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm install` | Install deps from `pnpm-lock.yaml` |
| `pnpm test` | Node test runner on `src/*.test.ts` |
| `pnpm run check-types` | `tsc --noEmit` |
| `pnpm run compile` | Types then esbuild → `dist/extension.js` |
| `pnpm run watch` | esbuild watch |
| `pnpm run package` | Production bundle (also `vscode:prepublish`) |
| `pnpm run icons` | Rebuild `media/icon.png` (128), `icon-512.png`, and social preview from `media/icon.svg` |
| `pnpm run vsix` | Production bundle + `vsce package --no-dependencies` |

VS Code tasks (Command Palette → **Run Task**): Watch, Test, Types, Compile, Package. GitHub Actions runs `pnpm test` and `pnpm run check-types` on `main` and pull requests.

## Extension Host

`.vscode/launch.json` uses the default build task, then opens `test-workspace/` with `--extensionDevelopmentPath` set to this repo. Chrome colors from the running extension land in `test-workspace/.vscode/settings.json`, which is gitignored.

Do not apply Workspace Color to this repository folder if you want a clean git tree. `.vscode/settings.json` here is gitignored for that reason.

## Theme keys

`src/chrome.ts` maps surfaces to VS Code color customizations:

- Window shell: `titleBar.*`, `sash.hoverBorder`
- Activity bar: `activityBar.*` and `activityBarTop.*` (side vs top/bottom)
- Status bar: `statusBar.*` including remote-item keys
- Command center: `commandCenter.*`

Modern UI can force some bars transparent. **Disable Modern UI** in the panel writes `workbench.experimental.modernUI` to `false` and asks to reload. Uncheck it to restore Modern UI.

## Package a VSIX

```bash
pnpm run vsix
```

Output `*.vsix` is gitignored. `.vscodeignore` keeps source maps, tests, docs, SVG sources, and agent files out of the VSIX. Full Marketplace steps (publisher, PAT / Entra ID, Open VSX): [publishing](publishing.md).
