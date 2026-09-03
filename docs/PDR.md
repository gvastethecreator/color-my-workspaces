# PDR — Color My Workspaces

Repo: `X:\\vscode-extensions\\vscode-color-my-workspaces`
Remote: `gvastethecreator/vscode-color-my-workspaces`
Extension id: `gvastethecreator.color-my-workspaces`

## Status

0.1.0 release candidate · Priority P0

## Product summary

Color My Workspaces gives each VS Code workspace a stable visual identity. It colors selected window-chrome surfaces and keeps one accessible Status Bar control for changing or clearing that identity.

The product is deliberately local-first. It has no telemetry, account, cloud service, workspace scan, document parser, or command execution.

## User jobs

1. Distinguish similar VS Code windows quickly.
2. Derive a stable color from a local, remote, virtual, single-folder, multi-root, or saved-workspace URI.
3. Pick a color, label, icon, and chrome surfaces.
4. Restore pre-existing color customizations safely.
5. Keep third-party or manual color changes instead of overwriting them silently.

## 0.1.0 scope

- explicit first application; no workspace configuration write on first activation;
- optional per-workspace automatic reapplication;
- title bar, activity bar, Status Bar, and command center color groups;
- deterministic folder/workspace color and bounded palette;
- one Status Bar item with Quick Pick or full-panel click behavior;
- secured settings webview with keyboard paths and text equivalents;
- versioned local ownership, baseline, identity, and legacy 0.0.x migration state;
- conflict detection with keep, reapply, and stop-managing choices;
- reversible Clear and Reset commands;
- high-contrast suspension;
- explicit, reversible handling of VS Code's experimental Modern UI setting;
- Marketplace and Open VSX release automation.

## Lifecycle contract

### First activation

Activation registers commands and shows the workspace identity. It does not write `workbench.colorCustomizations` or `workspaceColor.*`.

### First apply

A palette choice, folder color, Surprise Me, or explicit auto-apply opt-in may write workspace configuration. VS Code can store that configuration in `.vscode/settings.json` or a `.code-workspace` file, so it may appear in source control.

Before writing a managed color key, the extension captures whether the workspace value was absent or records its exact string value.

### Refresh and conflicts

The extension serializes writes, reads the latest configuration before every plan, skips identical writes, and verifies a written value. If a previously owned key differs from the last extension value, it is an external change.

The user can:

- keep the external value and block automatic writes to that key;
- reapply and use the external value as the new restore baseline;
- stop managing every affected surface.

### Clear and Reset

Clear restores intact baselines and removes the saved color. It preserves unmanaged and externally changed keys.

Reset does the same restoration, then removes all `workspaceColor.*` workspace values and restores a Modern UI value changed by the extension when ownership is still intact.

## Commands

- `workspaceColor.applyFromFolder`
- `workspaceColor.pick`
- `workspaceColor.quickActions`
- `workspaceColor.surprise`
- `workspaceColor.reset`
- `workspaceColor.resetSettings`
- `workspaceColor.reapply`
- `workspaceColor.openPanel`

Command ids are public integration points and remain stable.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `workspaceColor.color` | empty | Saved hex color; empty uses the stable derived color |
| `workspaceColor.autoApply` | `false` | Reapply after explicit opt-in |
| `workspaceColor.identity` | empty | Stable identity override for color derivation |
| `workspaceColor.label` | empty | Status Bar name; empty uses the workspace or folder name |
| `workspaceColor.showStatusBarLabel` | `true` | Show the workspace name |
| `workspaceColor.icon` | empty | Status Bar Codicon id |
| `workspaceColor.showStatusBarIcon` | `false` | Show the selected or default icon |
| `workspaceColor.statusBarClick` | `quick` | Open Quick settings or Full settings |
| `workspaceColor.stepped` | `true` | Use a different tone on each surface |
| `workspaceColor.titleBar` | `true` | Color the title bar and window shell |
| `workspaceColor.activityBar` | `true` | Color the activity bar |
| `workspaceColor.statusBar` | `true` | Color the Status Bar |
| `workspaceColor.commandCenter` | `true` | Color the command center |

All extension settings use workspace-window scope.

## Compatibility

| Environment | Support |
| --- | --- |
| Desktop Node extension host | Full; VS Code 1.134 or newer |
| Web extension host / vscode.dev | No; there is no `browser` entry |
| Virtual Workspaces | Supported through URI identity and configuration APIs |
| Untrusted Workspaces | Supported; no workspace code is read or executed |
| Remote Development | Supported as a UI extension; remote URI authority/path remain part of identity |
| Empty window | Commands explain that a folder or saved workspace is required; no color is applied |
| Windows, macOS, Linux | Supported; CI runs current stable on all three |
| High Contrast / High Contrast Light | Chrome painting is suspended; text/icon identity remains |
| Experimental Modern UI | Best effort, separately detected and documented; never toggled automatically |

Minimum engine support and Modern UI shell behavior are separate contracts. Modern UI is experimental and can change independently of `engines.vscode`.

## Architecture

- `src/workspaceColorController.ts`: orchestration and VS Code configuration boundary;
- `src/ownership.ts`: pure baseline, conflict, apply, and restoration plans;
- `src/managedKeys.ts`: versioned key registry;
- `src/identity.ts`: canonical URI identity and legacy identity;
- `src/localState.ts`: versioned workspace-local migrations;
- `src/writeQueue.ts`: serialization and refresh coalescing;
- `src/compatibility.ts`: structured shell compatibility;
- `src/statusController.ts`: single Status Bar item lifecycle;
- `src/panel.ts`, `src/panelMessages.ts`, `src/panelClient.ts`: secured webview boundary and client.

The release runtime is bundled. There are no production dependencies.

## Security and privacy

- no telemetry or outbound product requests;
- no document contents, workspace files, environment values, secrets, or clipboard bytes are logged;
- clipboard access occurs only after the explicit Copy color action;
- the panel accepts exact runtime-validated messages;
- external URLs use one allowlisted HTTPS repository URL;
- CSP denies everything by default and allows only the bundled style and nonce-bound script;
- no command URIs, shell execution, workspace binary execution, or network fetches;
- Restricted Mode remains supported because the extension only uses configuration and UI APIs.

## Accessibility

- all panel features have keyboard controls and visible focus;
- controls use native labels, status text, validation, and text/hex equivalents;
- workspace identity is not encoded only by color;
- foreground selection targets at least WCAG 4.5:1, with black/white fallback;
- high-contrast themes retain Status Bar and panel identity while chrome overrides are suspended;
- the Status Bar item has a stable id, accessible label, tooltip, command, and sane priority.

## Assets

`media/source/color-my-workspaces-approved.png` preserves the approved transparent icon at 512×512. Marketplace and high-resolution PNGs are rendered directly from that raster source; no SVG reinterpretation remains. `media/preview.png` shows the extension applied to a synthetic TypeScript workspace, and `media/preview-settings.png` shows the minimal settings panel beside the same code. Both are native-alpha captures from Color My Workspaces 0.1.0 installed in stable VS Code.

## Explicit non-goals

- theme creation or broad theme management;
- coloring editor content;
- automatic repository commits;
- accounts, cloud sync, telemetry, or team service;
- automatic global setting changes;
- web-host support in 0.1.0;
- a separate “share color” command in 0.1.0. Workspace configuration is already portable when users choose to commit it; a second write path would be ambiguous.

## Acceptance criteria

- no first-run workspace mutation;
- existing 0.0.x users keep their stored color when legacy ownership is recognized;
- managed baselines restore without deleting unrelated values;
- external values are not silently overwritten;
- local, remote, virtual, saved, and multi-root identities are deterministic;
- text-bearing generated colors meet the chosen contrast policy;
- Extension Host integration covers activation, commands, application, external conflict, Clear, Reset, and panel lifecycle;
- production VSIX is inspected, installed into isolated directories, activated, and exercised;
- current stable, minimum, and Insiders checks are in CI;
- version, changelog, media, docs, package, and rollback instructions agree before publication.

## Release boundary

Implementation may produce and verify the 0.1.0 VSIX without registry credentials. Tagging, publishing, merging, unpublishing, or deprecating remain explicit operator actions.
