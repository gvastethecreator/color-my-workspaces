# Changelog

All notable changes to Color My Workspaces are documented in this file.

## [0.1.0] - Unreleased

### Added

- Explicit opt-in automatic application and a first-run policy that performs no workspace write on activation
- Versioned URI identity, local state, managed-key registry, baselines, generations, and 0.0.x migration
- External-change conflict choices: keep, reapply with a new baseline, or stop managing affected surfaces
- Reversible Clear and Reset behavior
- One accessible Status Bar controller and a Reapply command
- Structured classic/modern/unknown shell compatibility and reversible Modern UI scope handling
- High-contrast suspension and WCAG contrast-ratio foreground selection
- Runtime panel-message validation, cryptographic CSP nonce, bundled local assets, and DOM-only dynamic rendering
- Windows/macOS/Linux, minimum/stable/Insiders Extension Host CI matrix
- Isolated VSIX install/activation smoke test, deterministic media check, performance budgets, and independent Marketplace/Open VSX release jobs
- PDR, ADRs, compatibility, security, performance, and rollback documentation

### Changed

- Activity Bar enablement now follows its boolean setting consistently for side, top, and bottom positions
- Workspace identity now prefers the saved workspace URI or length-prefixed sorted folder URIs and keeps remote scheme/authority/path semantics
- Generated colors use black/white fallback when the normal foreground tokens cannot reach 4.5:1
- The panel no longer retains hidden webview context and uses external JavaScript/CSS
- Extension orchestration is split into ownership, identity, compatibility, status, panel, state, and queue modules
- Package version and minimum VS Code version are now 0.1.0 and 1.134

### Removed

- Two extremely high-priority Status Bar items
- Destructive key-list merging that could delete pre-existing or external values
- Automatic first-run chrome mutation for new workspaces
- Obsolete `merge.ts` ownership path

## [0.0.34] - 2026-08-31

### Changed

- Skip title bar, activity bar, and status bar borders when Modern UI is on so the window shell stays one surface
- Tighten the README header, badges, and Getting started section

## [0.0.33] - 2026-08-31

### Changed

- Smaller VSIX: drop the bundled Codicon font; the settings panel uses a Codicon SVG subset
- README uses the local extension icon on the right instead of a banner
- Exclude `social-preview.png` from the Marketplace package

## [0.0.31] - 2026-08-31

### Added

- Status Bar click can open Quick settings or Full settings

### Changed

- Activity Bar coloring is off by default when the activity bar is on the top or bottom, and on when it is on the side

## [0.0.3] - 2026-08-30

### Changed

- TypeScript 7, pnpm 12.1, and VS Code 1.134 toolchain baseline

## [0.0.2] - 2026-08-30

### Changed

- Simplified packaging docs and assets
- Removed unused helpers and duplicate media files

## [0.0.1] - 2026-08-30

### Added

- Per-workspace chrome coloring, settings panel, Status Bar identity, stepped tones, folder color, and Marketplace assets
