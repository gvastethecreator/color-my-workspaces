# Color My Workspaces — Complete delivery plan

Status: production-hardening specification and ordered ticket backlog  
Repository: `gvastethecreator/vscode-color-my-workspaces`  
Product phase: published and functional  
Current package version reviewed: `0.0.34`  
Next stabilization target: `0.1.0`  
Last reviewed: 2026-09-01

This document captures everything still required to turn the current published extension into a durable, compatibility-tested portfolio anchor. It does not propose a rewrite. It preserves the working product while addressing configuration ownership, rollback safety, current VS Code shell changes, accessibility, webview security, remote identity, integration testing, package verification, and release discipline.

---

## 1. Current state

Color My Workspaces already provides substantial working behavior:

- deterministic workspace-derived colors;
- manually selected and random colors;
- title bar, activity bar, status bar, and command-center customization;
- stepped tonal variants;
- workspace label and optional Codicon in the Status Bar;
- Quick Pick actions;
- a custom settings/preview webview;
- workspace-scoped configuration writes;
- preservation of unmanaged `workbench.colorCustomizations` keys during normal merge operations;
- tests for color, chrome, identity, icon, palette, merge, and display helpers;
- generated SVG/PNG/social assets;
- Marketplace metadata, publishing notes, and changelog;
- current TypeScript/esbuild build pipeline.

The extension is functional, but important production guarantees are still missing:

1. CI runs tests and type checking but does not compile, package, inspect, install, or activate the VSIX;
2. there is no VS Code Extension Host integration suite;
3. managed color keys are removed/reset without a complete baseline ownership and restoration model;
4. automatic application can mutate workspace configuration simply by opening a workspace;
5. workspace settings may be committed to source control without the user fully understanding the consequence;
6. external changes from the user, Settings Sync, another window, or another extension can race with extension writes;
7. compatibility with Peacock and other `workbench.colorCustomizations` writers is not covered by tests or conflict UX;
8. the extension changes the experimental `workbench.experimental.modernUI` setting and may offer to apply it globally;
9. current Modern UI behavior is an upstream-moving compatibility surface and needs a versioned support strategy;
10. workspace identity uses local filesystem-style paths and needs remote, URI, case, order, and multi-root stability review;
11. foreground selection uses a luminance threshold rather than choosing the highest measured contrast ratio;
12. two very-high-priority Status Bar items are created, and their ordering/UX needs compatibility and accessibility review;
13. webview messages are TypeScript-typed but not runtime-validated;
14. CSP nonce generation uses `Math.random()`;
15. `extension.ts` and `panel.ts` have become large coordination modules that are difficult to verify in isolation;
16. capability and extension-host location declarations are not explicit;
17. the declared minimum VS Code version has not been derived from the APIs actually used;
18. activation cost, configuration-write frequency, and repeated refresh behavior have not been measured;
19. high-contrast, reduced-motion, keyboard, screen-reader, and zoom behavior need formal QA;
20. release automation and rollback procedures are not complete.

---

## 2. Stabilization outcome

Color My Workspaces `0.1.0` should be a dependable workspace-identity tool with these guarantees:

1. it never destroys user-owned or third-party color customizations;
2. applying, changing, disabling, and uninstalling the extension has understandable and reversible effects;
3. automatic behavior is explicit and documented;
4. workspace and global settings are never changed outside the selected scope without a clear confirmation;
5. remote, local, single-folder, and multi-root workspaces derive stable identities;
6. colors remain readable in supported themes and high-contrast modes;
7. current and changing VS Code shell modes are detected and handled conservatively;
8. the webview accepts only validated messages and uses a strict CSP;
9. the packaged VSIX is built, inspected, installed, activated, and exercised in CI/release checks;
10. existing users retain their settings or receive a documented migration path.

---

## 3. Configuration ownership model

The extension writes a subset of `workbench.colorCustomizations`. Those keys are shared public settings, not a private database. The product therefore needs an explicit ownership model.

### 3.1 Managed keys

Maintain one versioned set of managed keys grouped by feature:

```ts
interface ManagedColorGroup {
  id: "titleBar" | "activityBar" | "statusBar" | "commandCenter";
  keys: readonly string[];
}
```

Requirements:

- one canonical list used by generation, merge, cleanup, docs, and tests;
- new keys added only with a migration/restore decision;
- unknown/unmanaged keys always preserved;
- compatibility aliases for older/newer VS Code keys documented;
- generated colors never overwrite a key outside enabled groups.

### 3.2 Baseline snapshot

Before first modifying a managed key in a workspace, capture the pre-extension state for that key:

- key absent;
- key present with a value;
- source scope and workspace identity;
- extension-managed generation/version;
- snapshot timestamp for diagnostics only.

Store the snapshot in extension workspace state, not in source-controlled workspace settings. Values are local UI preferences, not secrets, but the snapshot must remain scoped to the exact workspace identity.

### 3.3 Ownership record

For each managed key, track:

```ts
interface ManagedColorRecord {
  key: string;
  baseline: string | null;
  lastWritten: string;
  generation: number;
}
```

On refresh/reset:

- if the current setting still equals `lastWritten`, the extension may replace or restore it;
- if the current setting differs, treat it as an external modification;
- never overwrite an external modification silently;
- offer a clear choice: keep external value, reapply workspace color, or stop managing the key/group;
- batch conflicts into one interaction, not one notification per key.

### 3.4 Reset semantics

Separate commands clearly:

- **Clear Workspace Color**: stop applying the selected/derived color and restore the captured baseline for managed keys where ownership is intact;
- **Reset Color My Workspaces Settings**: clear extension-owned settings after confirmation, restore baselines, and preserve unrelated workbench configuration;
- **Reapply Workspace Color**: intentionally take ownership of enabled managed keys after showing conflicts;
- uninstall cannot execute arbitrary cleanup reliably, so the README must explain how to restore before uninstalling.

A reset must not merely delete keys that had valid user values before extension use.

### 3.5 Concurrent changes

Before every configuration write:

1. inspect the latest scoped value;
2. compare it to the expected last-written state;
3. merge against the latest object;
4. preserve external changes;
5. reject or resolve managed-key conflicts;
6. serialize extension writes through one queue/generation;
7. ignore stale refresh results;
8. verify the final scoped value.

Test simultaneous windows and Settings Sync-like changes.

---

## 4. Automatic application and source-control behavior

The current default behavior can derive a color and write workspace settings when a workspace opens. This is visible and useful, but it is also a mutation of project configuration.

Approve a product ADR before `0.1.0` covering these options:

### Option A — explicit first application

- no workspace write until the user invokes Apply/Pick/Surprise;
- remember that the workspace is managed afterward;
- safest and clearest default.

### Option B — automatic derived color with onboarding consent

- first open shows one concise choice;
- user can enable automatic application for this workspace;
- no write before consent;
- preference and baseline stored locally.

### Option C — current automatic default

Retain only if documented prominently and backed by:

- baseline restoration;
- clean source-control explanation;
- conflict handling;
- one-time onboarding;
- tests proving no repeated unnecessary writes.

Recommended direction: explicit first application or one-time opt-in. Do not silently add/change `.vscode/settings.json` in every repository merely because the extension is installed.

### Workspace file implications

Document separately:

- single-folder workspace: settings generally live in `.vscode/settings.json`;
- multi-root workspace: settings may live in the `.code-workspace` file;
- those files may be committed and affect teammates;
- users can intentionally share colors, but this should be a deliberate workflow;
- local-only workspace identity/baseline state belongs in `workspaceState`, not committed settings.

Consider a future explicit **Share this workspace color** command rather than making sharing an accidental side effect.

---

## 5. Modern UI compatibility strategy

`workbench.experimental.modernUI` is an upstream experimental setting and its treatment of shell colors may change between VS Code releases.

### Required policy

- never toggle Modern UI automatically;
- keep the control explicitly labeled as experimental and version-sensitive;
- explain exactly which scope will change before writing;
- do not fall back from rejected workspace scope to Global with a generic one-click action; require an explicit second confirmation identifying “all VS Code windows”;
- capture the prior value/scope so a user can restore it;
- do not assume disabling Modern UI is the long-term fix for transparent bars;
- feature-detect available theme keys and current setting behavior where possible;
- maintain a tested compatibility table by VS Code stable version;
- remove or redesign the toggle if upstream removes/renames the setting;
- never depend on Proposed API.

### Compatibility modes

Define an internal result:

```ts
type ChromeCompatibility =
  | { mode: "classic" }
  | { mode: "modern"; limitations: readonly string[] }
  | { mode: "unknown"; limitations: readonly string[] };
```

Use it for panel explanation and generation decisions. Avoid hardcoded prose as the only source of compatibility logic.

### Test matrix

- current stable VS Code;
- minimum supported VS Code;
- current Insiders before release;
- Windows custom/native title bar combinations;
- macOS/Linux smoke checks;
- activity bar left/right/top/bottom/hidden;
- command center enabled/disabled;
- Modern UI on/off/setting absent;
- light/dark/high-contrast themes;
- remote windows.

---

## 6. Workspace identity specification

A derived color should be stable for the logical workspace without leaking machine-specific accidents.

### Identity inputs

Preferred normalized identity, in order:

1. canonical workspace-file URI for a saved multi-root workspace;
2. ordered or intentionally sorted canonical workspace-folder URIs;
3. optional user-controlled identity override;
4. no identity for an empty window.

### Decisions

- use URI strings, not only `fsPath`;
- normalize scheme/authority/path carefully without corrupting case-sensitive remote paths;
- define whether folder ordering should affect identity; recommended: sort canonical folder URIs so reordering folders does not unexpectedly recolor the workspace;
- distinguish two workspaces with the same basename but different locations;
- define Windows drive-letter/case normalization;
- preserve remote authority so local and remote copies may intentionally differ, or expose a setting if users want path-independent identity;
- avoid including ephemeral session identifiers;
- maintain the current hash algorithm or migrate with an explicit compatibility setting so existing derived colors do not unexpectedly change;
- test `.code-workspace`, untitled workspaces, WSL, SSH, Dev Containers, and Codespaces.

### Backward compatibility

Because existing users may rely on current derived colors:

- version the identity algorithm;
- default existing managed workspaces to legacy identity until user opts to migrate, or provide an automatic migration that preserves the current stored color;
- document why a derived color changed;
- never change the hash algorithm silently in a patch release.

---

## 7. Color and accessibility contract

### 7.1 Contrast selection

Replace the fixed luminance threshold with actual contrast-ratio comparison:

```text
contrast(background, darkForeground)
contrast(background, lightForeground)
→ choose the higher valid ratio
```

Requirements:

- use WCAG relative luminance/contrast formula;
- choose between carefully selected dark and light foreground tokens;
- establish a minimum target for text-bearing surfaces;
- if a requested background cannot produce sufficient contrast for all required VS Code states, adjust generated tone or warn;
- test active/inactive title text, Status Bar text, command center text, hover/active states, and remote/debugging status states;
- preserve theme/high-contrast overrides where VS Code should remain authoritative.

### 7.2 Derived palette

The identity/random generator should avoid unusably bright, muddy, or indistinguishable colors.

Define bounded HSL/OKLCH policy with tests for:

- minimum/maximum lightness;
- saturation range;
- contrast against selected foreground;
- stepped-tone ordering;
- hue distribution;
- color-blind distinguishability is helpful but cannot be guaranteed by hue alone;
- deterministic output for a fixed identity/version;
- random color generation using a suitable randomness source only for UX variety, not security.

### 7.3 High contrast and user themes

- detect high-contrast theme kind and avoid overriding accessibility-critical foregrounds/backgrounds where necessary;
- provide a setting or automatic policy to disable chrome painting in high-contrast modes;
- verify focus borders and Status Bar accessibility labels;
- no meaning conveyed solely through the color chip;
- project name/icon and tooltip remain available when color is not perceivable.

---

## 8. Status Bar contract

The extension currently uses two very high-priority left-aligned Status Bar items, switching between a color chip and project label.

Required review:

- choose priorities that do not attempt to outrank reserved VS Code/remote/SCM items unpredictably;
- keep at most one visible extension item at a time;
- use stable unique IDs;
- ensure hiding one and showing the other does not cause flicker;
- keep labels short and user-controllable;
- escape/validate Codicon IDs;
- tooltip includes workspace name and current color without exposing an absolute path;
- accessible label describes action and workspace;
- click behavior remains configurable but consistent;
- no Status Bar item in empty windows;
- no decorative custom background color for the item;
- test remote indicator ordering and narrow-window overflow;
- ensure repeated refresh does not recreate items;
- consider one unified item instead of two if text/color state can be updated without layout instability.

---

## 9. Webview security and architecture

The settings panel remains useful because it previews several coordinated shell surfaces. It must be hardened as an explicit trust boundary.

### Runtime validation

Every incoming `unknown` message must be parsed through a runtime validator/type guard:

- known `type` only;
- maximum string lengths;
- booleans are actual booleans;
- colors pass exact normalization;
- Codicon IDs pass exact validation;
- click targets and chrome elements are allowlisted;
- URLs match the exact support URL;
- no prototype-bearing or unexpected nested data is trusted;
- malformed messages are ignored or reported without echoing payload content.

### CSP and resources

- replace `Math.random()` nonce with `node:crypto.randomBytes`;
- set `default-src 'none'`;
- prefer external bundled script/style files and `webview.asWebviewUri` where practical;
- limit `localResourceRoots`;
- no command URIs;
- no remote scripts/fonts/images;
- exact URL allowlist;
- no source-derived HTML inserted without escaping;
- prefer `createElement` and `textContent` for dynamic content;
- review `retainContextWhenHidden`; default off unless measured UX benefit outweighs memory;
- dispose all listeners/panel references exactly once.

### Accessibility

- full keyboard navigation;
- visible focus;
- correct labels/descriptions/status regions;
- responsive at 200% zoom and narrow panel widths;
- high-contrast compatibility;
- native theme variables;
- no color-only controls: display hex/name/text equivalents;
- confirmation and error messages announced accessibly;
- “Disable Modern UI” wording must communicate scope and restart requirement.

---

## 10. Internal architecture target

Do not rewrite working pure modules. Split orchestration so critical behavior can be integration-tested.

Recommended structure:

```text
src/
├─ extension.ts                 # activation/composition only
├─ commands/
│  ├─ applyDerived.ts
│  ├─ pickColor.ts
│  ├─ surprise.ts
│  ├─ clear.ts
│  ├─ reset.ts
│  └─ quickActions.ts
├─ configuration/
│  ├─ read.ts
│  ├─ writeQueue.ts
│  ├─ ownership.ts
│  ├─ baseline.ts
│  ├─ conflicts.ts
│  └─ scopes.ts
├─ workspace/
│  ├─ identity.ts
│  └─ context.ts
├─ chrome/
│  ├─ colors.ts
│  ├─ compatibility.ts
│  └─ managedKeys.ts
├─ status/
│  ├─ controller.ts
│  └─ display.ts
├─ panel/
│  ├─ controller.ts
│  ├─ messages.ts
│  ├─ state.ts
│  ├─ html.ts
│  └─ media/
└─ platform/
   ├─ logging.ts
   └─ version.ts
```

### Principles

- pure color/identity/merge logic remains independent from VS Code;
- one controller owns Status Bar lifecycle;
- one serialized writer owns `workbench.colorCustomizations` writes;
- one ownership service resolves baseline/conflicts;
- panel rendering/message parsing is separate from command execution;
- `extension.ts` registers dependencies and events but does not contain all business logic;
- configuration-change loops caused by the extension's own writes are coalesced;
- no duplicated state between panel, settings, workspaceState, and Status Bar without an explicit authority model.

---

## 11. Manifest, capabilities, and extension host

### Runtime

This extension is a UI/workbench customization extension. Investigate and test:

- `extensionKind: ["ui"]` so remote windows run it locally where workbench settings/UI live;
- behavior when installed only remotely versus locally;
- WSL/SSH/Dev Container/Codespaces installation prompts;
- whether all used configuration scopes are available in the UI host;
- no browser/web extension claim unless a real browser entry and compatible behavior exist.

### Capabilities

- Restricted Mode: likely supported because the extension does not execute workspace code, but workspace writes and experimental setting changes must be tested and documented;
- Virtual Workspaces: color/label behavior may be supported, but identity and writable workspace settings differ by provider; test before declaring;
- empty window: no active color application;
- minimum VS Code: derive from actual Status Bar/configuration/webview APIs and Modern UI compatibility, then test minimum plus current stable;
- activation: `onStartupFinished` may be justified for automatic shell identity, but measure it and avoid writes when nothing changes.

### Settings schema

Review:

- `scope` for each setting (`window`, `resource`, etc. where applicable);
- markdown descriptions and examples;
- enum descriptions;
- deprecations/migrations;
- default changes only in minor release with release notes;
- no setting promises an unsupported surface in current Modern UI;
- experimental controls are clearly labeled.

---

## 12. Performance and lifecycle budgets

Measure with cold/warm activation and repeated configuration changes.

Targets:

- activation under 75 ms before asynchronous configuration update;
- no configuration write when generated managed values already match current state;
- one serialized/coalesced paint operation for a burst of settings/workspace events;
- no feedback loop from own `workbench.colorCustomizations` write;
- panel opens under 150 ms excluding webview bootstrap;
- panel hidden/disposed memory returns to baseline within reason;
- Status Bar items created once per extension lifecycle;
- icon rendering script deterministic and outside extension runtime;
- no filesystem/workspace scanning;
- no network requests;
- all subscriptions/timers/panels/status items disposed;
- logging silent by default and free of full paths unless user explicitly enables diagnostic mode.

Record timings and environment in release evidence.

---

## 13. Test matrix

### Pure unit tests

Expand existing tests for:

- managed key groups and migration;
- baseline capture/restore;
- ownership conflict detection;
- three-way merge against latest settings;
- identity canonicalization across file/remote URIs;
- folder order/case/drive behavior;
- identity algorithm version migration;
- contrast ratios for generated/palette colors;
- foreground selection;
- high-contrast policy;
- Modern UI compatibility results;
- setting normalization;
- panel message parser;
- write queue/coalescing;
- Status Bar formatting and priorities;
- no-op paint detection.

### Desktop Extension Host tests

- activate in empty/single-folder/multi-root/saved-workspace windows;
- first application/consent behavior;
- apply/pick/surprise/undo/clear/reset;
- unmanaged colors preserved;
- pre-existing managed keys restored;
- external managed-key change causes conflict, not overwrite;
- two window instances changing the same workspace;
- configuration change loop prevention;
- Status Bar click actions, icon/label/chip/accessibility;
- panel open/message/reset/cancel;
- Modern UI scope confirmation and reload behavior;
- Restricted Mode;
- Virtual Workspace where testable;
- minimum/current VS Code;
- extension disable/uninstall cleanup documentation path.

### Remote/platform/manual tests

- Windows, macOS, Linux;
- WSL;
- Remote SSH;
- Dev Containers;
- Codespaces;
- native/custom title bar;
- activity bar locations;
- command center enabled/disabled;
- Modern UI on/off/unavailable;
- dark/light/high-contrast themes;
- Settings Sync or simulated concurrent external changes;
- Peacock installed and writing overlapping keys;
- narrow window and 200% zoom;
- screen-reader/keyboard smoke test.

### Package/release tests

- unit/type/compile/production bundle;
- deterministic icon generation and dimensions;
- VSIX creation and content inspection;
- clean-profile install;
- packaged activation and all commands;
- Marketplace icon/README/media rendering;
- version/tag/changelog consistency;
- rollback to previous package;
- public listing install after release.

---

## 14. Ordered ticket backlog

Use these IDs in GitHub Issues, branches, commits, and PR descriptions.

### Release infrastructure

#### CMW-001 — Add compile, package, and VSIX inspection to CI
Priority: P0  
Depends on: none

Run unit tests, type checking, production bundle, icon consistency, `vsce package`, archive inspection, and artifact upload. Fail on missing runtime/media/license files.

#### CMW-002 — Add VS Code Extension Host integration harness
Priority: P0  
Depends on: CMW-001

Add `@vscode/test-electron`, fixture workspaces, isolated user data/extensions directories, activation/command/configuration tests, and deterministic CI timeouts.

#### CMW-003 — Derive and test minimum VS Code version
Priority: P0  
Depends on: CMW-002

Inventory APIs/settings, choose real minimum, test minimum and current stable, and document Modern UI support separately from engine compatibility.

#### CMW-004 — Define UI-host, Restricted Mode, and Virtual Workspace declarations
Priority: P0  
Depends on: CMW-002

Test and set `extensionKind`, `capabilities`, activation behavior, remote install location, empty-window behavior, and truthful unsupported environments.

### Configuration ownership and reversibility

#### CMW-005 — Define versioned managed color-key registry
Priority: P0  
Depends on: none

Centralize groups/keys/aliases and use them in generation, merging, reset, docs, and tests.

#### CMW-006 — Implement baseline snapshot model
Priority: P0  
Depends on: CMW-005

Capture absent/present pre-extension values per workspace identity in local workspace state before first ownership.

#### CMW-007 — Implement managed-key ownership records
Priority: P0  
Depends on: CMW-006

Track baseline, last written value, generation, and enabled group so the extension knows which values it may safely update/restore.

#### CMW-008 — Implement external-change conflict detection
Priority: P0  
Depends on: CMW-007

Detect user/extension/other-window changes to managed keys, preserve them, batch conflicts, and offer explicit resolution.

#### CMW-009 — Serialize and coalesce configuration writes
Priority: P0  
Depends on: CMW-007

Create one generation-aware write queue, merge against latest values, suppress own-event loops, no-op identical writes, and verify final state.

#### CMW-010 — Redesign Clear and Reset restoration semantics
Priority: P0  
Depends on: CMW-006 through CMW-009

Restore baselines where ownership is intact, preserve conflicts/unmanaged keys, distinguish extension settings reset from color clear, and add confirmation/evidence.

#### CMW-011 — Add concurrent-window and Settings Sync conflict tests
Priority: P0  
Depends on: CMW-008 through CMW-010

Simulate stale/external changes and prove the extension never overwrites them silently.

#### CMW-012 — Test coexistence with Peacock/manual color customizations
Priority: P0  
Depends on: CMW-008 through CMW-010

Build overlapping/unmanaged-key fixtures, document coexistence limits, and ensure deterministic conflict UX.

### Automatic behavior and settings scope

#### CMW-013 — Approve automatic-application/source-control ADR
Priority: P0  
Depends on: CMW-006

Choose explicit first apply, opt-in auto apply, or hardened current default. Cover committed workspace settings and onboarding.

#### CMW-014 — Implement approved first-run/auto-apply policy
Priority: P0  
Depends on: CMW-013

Avoid writes before required consent, store local management state, prevent repeated onboarding, and preserve current users through migration.

#### CMW-015 — Audit every setting scope/default/description
Priority: P0  
Depends on: CMW-013

Define workspace/resource/window scope, update markdown descriptions/enums, mark experimental fields, and remove ambiguous behavior.

#### CMW-016 — Implement settings migration framework
Priority: P1  
Depends on: CMW-015

Version local state/configuration migrations, preserve existing `0.0.x` behavior, make migrations idempotent, and record completed schema version.

#### CMW-017 — Design explicit shared-color workflow
Priority: P2  
Depends on: CMW-013

Evaluate a `Share this workspace color` command that intentionally writes portable workspace configuration, separate from local-only management.

### Modern UI and shell compatibility

#### CMW-018 — Approve Modern UI compatibility ADR
Priority: P0  
Depends on: CMW-003

Define feature detection, limitations, scope, upstream tracking, previous-value restoration, and removal conditions.

#### CMW-019 — Harden experimental Modern UI setting changes
Priority: P0  
Depends on: CMW-018

Never toggle automatically; provide explicit scope confirmation, capture prior value, avoid casual global fallback, and verify reload state.

#### CMW-020 — Implement structured chrome compatibility detector
Priority: P0  
Depends on: CMW-018

Move compatibility logic out of prose, cover activity bar locations/current keys/unknown versions, and feed panel/generator consistently.

#### CMW-021 — Establish VS Code stable/Insiders shell regression matrix
Priority: P0  
Depends on: CMW-020

Run current stable/minimum/Insiders and platform/title-bar/activity-bar/theme combinations before each release; record evidence.

### Identity, colors, and accessibility

#### CMW-022 — Canonicalize workspace identity with URIs
Priority: P0  
Depends on: CMW-004

Define saved workspace/folder ordering, remote authority, Windows case/drives, virtual URIs, empty window, and override behavior.

#### CMW-023 — Version and migrate the identity algorithm
Priority: P0  
Depends on: CMW-022

Avoid unexpected color changes for existing users; preserve stored color or offer explicit migration and tests.

#### CMW-024 — Replace luminance threshold with contrast-ratio selection
Priority: P0  
Depends on: none

Implement WCAG contrast calculation, select the better foreground, verify text-bearing chrome states, and add generated-color property tests.

#### CMW-025 — Audit generated palette and stepped tones
Priority: P1  
Depends on: CMW-024

Bound saturation/lightness, ensure tonal ordering/contrast, inspect hue distribution, and define inaccessible-color fallback.

#### CMW-026 — Implement high-contrast-safe policy
Priority: P0  
Depends on: CMW-024, CMW-025

Test/detect high-contrast themes, avoid overriding critical surfaces, preserve non-color identity, and document behavior.

#### CMW-027 — Complete keyboard, zoom, screen-reader, and theme QA
Priority: P0  
Depends on: CMW-026 and panel/status work

Cover 200% zoom, narrow views, focus order, accessible names, dark/light/high contrast, and no color-only meaning.

### Status Bar hardening

#### CMW-028 — Approve Status Bar item/priority design
Priority: P0  
Depends on: CMW-004

Evaluate one versus two items, sane priorities, remote/SCM ordering, narrow-window overflow, click behavior, and current UX guidance.

#### CMW-029 — Implement unified Status Bar controller
Priority: P0  
Depends on: CMW-028

Own lifecycle/state in one module, ensure one visible item, avoid flicker/recreation, validate labels/icons, and dispose cleanly.

#### CMW-030 — Add Status Bar integration/accessibility tests
Priority: P0  
Depends on: CMW-029

Test empty/workspace/remote states, label/icon/chip modes, commands, tooltips, accessibility info, priorities, and repeated refresh.

### Webview hardening and refactor

#### CMW-031 — Add runtime parser for panel messages
Priority: P0  
Depends on: none

Validate all unknown payloads, lengths, colors, icons, enums, booleans, elements, and exact URLs. Add malformed/hostile message tests.

#### CMW-032 — Replace panel nonce with cryptographic generation
Priority: P0  
Depends on: CMW-031

Use `node:crypto`, enforce strict CSP, minimal resources, exact URL allowlist, and no command URIs.

#### CMW-033 — Review externalized panel assets and localResourceRoots
Priority: P1  
Depends on: CMW-032

Move script/style to bundled local resources where beneficial, use `asWebviewUri`, minimize roots, and inspect packaged paths.

#### CMW-034 — Replace unsafe/difficult dynamic HTML paths with DOM APIs
Priority: P1  
Depends on: CMW-031

Use `createElement`/`textContent` for source-derived dynamic content and retain escaping tests for static template values.

#### CMW-035 — Review panel retention, lifecycle, and memory
Priority: P1  
Depends on: CMW-033

Disable `retainContextWhenHidden` unless justified, restore state safely, avoid duplicate subscriptions, and profile open/hide/dispose cycles.

#### CMW-036 — Complete panel accessibility and experimental-setting UX
Priority: P0  
Depends on: CMW-019, CMW-031 through CMW-035

Test labels, keyboard, focus, status announcements, contrast, zoom, validation, reset/conflict dialogs, and global-scope wording.

#### CMW-037 — Split extension orchestration into testable services
Priority: P1  
Depends on: CMW-009, CMW-020, CMW-029, CMW-031

Reduce `extension.ts`/`panel.ts` responsibilities without changing public behavior; add composition and regression tests.

### Performance, media, documentation, and release

#### CMW-038 — Profile activation, refresh, writes, Status Bar, and panel
Priority: P0  
Depends on: core hardening tickets

Measure cold/warm activation, no-op refresh, event bursts, configuration loops, panel memory, and lifecycle disposal. Record budgets/results.

#### CMW-039 — Make icon/media generation reproducible
Priority: P1  
Depends on: none

Pin rendering inputs/dependencies, verify dimensions/color profiles/transparency, generate deterministic assets, and test manifest icon existence.

#### CMW-040 — Complete privacy, security, and dependency review
Priority: P0  
Depends on: CMW-031 through CMW-039

Audit no network/telemetry, logs/paths, workspace trust, panel boundary, experimental setting changes, dependencies/licenses, and update policy.

#### CMW-041 — Rewrite README around actual user lifecycle
Priority: P1  
Depends on: final behavior

Document first apply, automatic policy, committed settings, baseline/clear/reset, conflict handling, Modern UI limitations, remote/high-contrast support, troubleshooting, privacy, and real screenshots.

#### CMW-042 — Establish release automation and rollback procedure
Priority: P0  
Depends on: CMW-001 through CMW-041

Verify version/changelog/tag, run release candidate matrix, create/inspect/sign artifacts where applicable, publish safely, retain prior VSIX, and document rollback/unpublish boundaries.

#### CMW-043 — Release and verify `0.1.0`
Priority: P0  
Depends on: CMW-042

Publish Marketplace/Open VSX where supported, install public artifacts, verify upgrades from current `0.0.x`, test reset/migration, and monitor first-week reports.

---

## 15. Launch gate for `0.1.0`

Do not release until:

- CI compiles, packages, inspects, installs, activates, and exercises the VSIX;
- Extension Host tests cover application, external changes, clear, reset, and migrations;
- pre-existing managed colors are restored rather than destroyed;
- user/third-party changes are never silently overwritten;
- automatic workspace mutation follows an approved and documented policy;
- Modern UI changes are explicit, reversible, scope-aware, and tested;
- workspace identity is URI/remote/multi-root stable with migration behavior;
- foreground and generated colors meet the chosen contrast policy;
- high-contrast mode remains usable without color-only identification;
- Status Bar priority/lifecycle/accessibility is reviewed and tested;
- every panel message is runtime-validated;
- CSP uses a cryptographic nonce and minimal resource permissions;
- current stable, minimum, and Insiders shell matrices are recorded;
- no repeated/no-op configuration writes occur;
- package/media/changelog/version are consistent;
- upgrade from the currently published `0.0.x` line is tested;
- rollback instructions and prior artifact are available;
- no unresolved P0 correctness, data-loss, compatibility, or security issue remains.

---

## 16. Post-`0.1.0` candidates

Evaluate only after stabilization data:

- intentional team/shared color profiles;
- named workspace palettes;
- import/export of extension-owned color profiles;
- per-folder identity within a multi-root window;
- color history and undo beyond one action;
- theme-aware generated palettes;
- Profiles integration where public APIs support it;
- optional sync of extension preferences without syncing project color;
- richer icon presets.

Do not add account/cloud services, telemetry, automatic repository commits, or broad theme management without a separate PDR.

---

## 17. Primary references

- https://code.visualstudio.com/api
- https://code.visualstudio.com/api/references/extension-manifest
- https://code.visualstudio.com/api/references/activation-events
- https://code.visualstudio.com/api/references/theme-color
- https://code.visualstudio.com/api/references/icons-in-labels
- https://code.visualstudio.com/api/references/vscode-api#StatusBarItem
- https://code.visualstudio.com/api/extension-guides/webview
- https://code.visualstudio.com/api/extension-guides/workspace-trust
- https://code.visualstudio.com/api/extension-guides/virtual-workspaces
- https://code.visualstudio.com/api/advanced-topics/extension-host
- https://code.visualstudio.com/api/advanced-topics/remote-extensions
- https://code.visualstudio.com/api/ux-guidelines/status-bar
- https://code.visualstudio.com/api/ux-guidelines/webviews
- https://code.visualstudio.com/api/ux-guidelines/settings
- https://code.visualstudio.com/api/working-with-extensions/testing-extension
- https://code.visualstudio.com/api/working-with-extensions/bundling-extension
- https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- https://github.com/microsoft/vscode-extension-samples
