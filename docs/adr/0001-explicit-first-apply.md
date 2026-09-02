# ADR 0001: Explicit first apply

Status: Accepted
Date: 2026-09-02

## Context

Color application writes workspace configuration. VS Code may persist it in `.vscode/settings.json` or a `.code-workspace` file, so an automatic first-run write can dirty a repository or change a shared workspace without consent. Existing 0.0.x users may already depend on automatic color restoration.

## Decision

- New workspaces do not write configuration during activation.
- A command, panel color choice, or explicit `workspaceColor.autoApply` opt-in is consent to apply.
- `autoApply` defaults to `false` and is scoped to the workspace window.
- Once the extension owns colors, refreshes keep them current until Clear disables management.
- Exact legacy-generated 0.0.x values migrate as existing ownership and retain legacy automatic behavior.
- The README warns that applying can modify a tracked workspace file.
- Onboarding is shown once and never opens promotional content.

## Consequences

First use needs one action. Repository mutation becomes predictable. Legacy migration cannot recover a pre-0.0.x baseline that the old version never stored; Clear removes those recognized legacy-owned keys.
