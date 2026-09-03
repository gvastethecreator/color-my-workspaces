# 0.1.0 implementation evidence

Updated: 2026-09-02
Source specification: [DELIVERY-PLAN.md](DELIVERY-PLAN.md)

Status vocabulary:

- **Implemented**: code/docs and local deterministic evidence exist.
- **Matrix gate**: implementation exists; a listed CI/manual environment must still run.
- **Operator gate**: requires an authorized remote release action.

## Control summary

| Area | Tickets | State |
| --- | --- | --- |
| Release infrastructure | CMW-001–004 | Implemented locally; platform/Insiders CI evidence remains a matrix gate |
| Ownership/reversibility | CMW-005–012 | Implemented and covered by unit + stable Extension Host |
| Automatic behavior | CMW-013–017 | Implemented; separate share command explicitly rejected for 0.1.0 |
| Modern UI | CMW-018–021 | Implemented; platform/Insiders/rendered evidence remains a matrix gate |
| Identity/accessibility | CMW-022–027 | Implemented; normal, High Contrast, and 200% rendered evidence passes locally |
| Status Bar | CMW-028–030 | Implemented; rendered/narrow evidence remains a matrix gate |
| Webview/refactor | CMW-031–037 | Implemented; CSP, accessibility tree, normal, High Contrast, and 200% rendered evidence passes locally |
| Performance/media/docs/release | CMW-038–042 | Implemented and locally measured |
| Public release | CMW-043 | Operator gate; no tag/publish performed |

## Ticket ledger

| Ticket | State | Artifact/evidence |
| --- | --- | --- |
| CMW-001 | Implemented | CI quality/package jobs, production bundle, media, VSIX inspection/artifact |
| CMW-002 | Implemented | `.vscode-test.mjs`, isolated fixtures, 7 Extension Host tests |
| CMW-003 | Implemented | Engine 1.134; local 1.134 and stable 1.135 pass; minimum/stable/Insiders CI lanes |
| CMW-004 | Implemented | UI host, trust/virtual declarations, empty-window behavior, manifest test/PDR |
| CMW-005 | Implemented | `managedKeys.ts` registry/version/groups and registry tests |
| CMW-006 | Implemented | Per-key absent/present baseline capture in local workspace state |
| CMW-007 | Implemented | Last written value, generation, group, capture time, workspace identity |
| CMW-008 | Implemented | Keep/reapply/stop conflict flow and blocked keys |
| CMW-009 | Implemented | Serialized/coalesced queue, latest snapshot, stale-plan abort, verify/no-op |
| CMW-010 | Implemented | Confirmed Clear vs Reset with safe restoration |
| CMW-011 | Implemented | Stale/external unit cases and Extension Host external-change test |
| CMW-012 | Matrix gate | Unmanaged/overlapping fixtures pass; real Peacock manual lane remains |
| CMW-013 | Implemented | ADR 0001 |
| CMW-014 | Implemented | No first activation write, opt-in auto apply, onboarding/migration state |
| CMW-015 | Implemented | Window-scoped setting audit, defaults/descriptions/enums, README table |
| CMW-016 | Implemented | Local schema v2, registry/identity versions, legacy recognition, rebinding tests |
| CMW-017 | Implemented | ADR 0004 rejects duplicate share path and documents source-control behavior |
| CMW-018 | Implemented | ADR 0002 |
| CMW-019 | Implemented | Exact scope prompts, second global prompt, prior-value record/restore/reload |
| CMW-020 | Implemented | Structured classic/modern/unknown detector and activityBarTop coverage |
| CMW-021 | Matrix gate | Stable/minimum/Insiders and three-OS CI matrix; rendered matrix documented |
| CMW-022 | Implemented | URI scheme/authority/path, Windows case, saved/multi-root/override/empty |
| CMW-023 | Implemented | Identity v2, length prefixes, legacy identity/color preservation, rebind |
| CMW-024 | Implemented | WCAG luminance/ratio, better token, black/white 4.5 fallback tests |
| CMW-025 | Implemented | Saturation/lightness property run, palette hue/order, stepped-tone tests |
| CMW-026 | Implemented | Active-theme detection and high-contrast chrome suspension |
| CMW-027 | Matrix gate | Normal, High Contrast, accessible names, and ~200%/207 px pass locally; Light, High Contrast Light, and full keyboard matrix remain |
| CMW-028 | Implemented | ADR 0003, one item, priority 100 |
| CMW-029 | Implemented | `StatusController`, stable item id/lifecycle/presentation |
| CMW-030 | Matrix gate | Unit presentation + repeated Extension Host refresh; panel has no horizontal overflow at ~200%; narrow workbench Status Bar matrix remains |
| CMW-031 | Implemented | Exact own-object message parser and hostile/malformed tests |
| CMW-032 | Implemented | 192-bit crypto nonce, default-deny CSP, exact support URL |
| CMW-033 | Implemented | Bundled panel JS/CSS, `asWebviewUri`, dist-only root, VSIX inspection |
| CMW-034 | Implemented | Dynamic panel state uses DOM/textContent; static values escaped |
| CMW-035 | Implemented | No retained context, disposal ownership, three open/dispose cycles |
| CMW-036 | Matrix gate | Labels/status/validation/global wording, AX names, normal, High Contrast, and ~200% rendered QA pass; full keyboard/light-theme matrix remains |
| CMW-037 | Implemented | Composition controller plus pure ownership/state/compat/status/panel/queue modules |
| CMW-038 | Implemented | Performance command, budgets, activation and panel lifecycle evidence |
| CMW-039 | Implemented | Pinned Sharp, deterministic rerender, dimensions/alpha/manifest checks |
| CMW-040 | Implemented | Threat/data/dependency/package/network review; production audit clean |
| CMW-041 | Implemented | README covers lifecycle, writes, baselines, conflicts, compatibility, privacy |
| CMW-042 | Implemented | Tag gate, isolated artifact, independent registry jobs, retention/rollback docs |
| CMW-043 | Operator gate | Release candidate can be built/installed; tag, publish and public verification require approval/secrets |

## Current local evidence

- TypeScript: pass
- Unit tests: 97 passing
- Production compile: pass
- VS Code stable 1.136.1 Extension Host: 7 passing
- VS Code minimum 1.134.0 Extension Host: 7 passing
- Production dependency audit: no known vulnerabilities
- Performance budgets: pass
- Local runtime/visual QA: Dark and Default High Contrast pass; 97 named controls, no unnamed interactive AX nodes, strict CSP, and no horizontal overflow at ~200%/207 px
- Media: deterministic raster icon and social assets pass; both 1200×800 native-alpha README previews come from Color My Workspaces 0.1.0 installed in stable VS Code
- VSIX: current 13-entry, 470,868-byte archive inspection passes; isolated install/activation/command/explicit-apply smoke passes on 1.136.1
- Code map: regenerated from the final module boundaries; static validation and self-contained Chrome smoke pass with no unknown edges or network requests
- Hosted Insiders, macOS, and Linux results remain remote CI gates; local Windows evidence does not replace them
- Registry publication: not authorized

## Release authority

Completing this ledger does not authorize commits, pushes, PR edits, merges, tags, releases, Marketplace/Open VSX publication, deprecation, or unpublishing. Those actions require an explicit mutation preview and approval.
