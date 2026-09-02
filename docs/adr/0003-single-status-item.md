# ADR 0003: One Status Bar item

Status: Accepted
Date: 2026-09-02

## Context

The 0.0.x implementation used two extremely high-priority Status Bar items. They could crowd out editor, source-control, and remote status and made lifecycle/accessibility state harder to coordinate.

## Decision

- Create one item with id `workspaceColor.status`.
- Use left alignment and priority 100.
- Keep the item instance for the extension lifetime; update or hide it without recreation.
- Show the configured icon/name, or a textual Codicon fallback when both are hidden.
- Keep workspace name and hex in the tooltip.
- Route clicks to Quick settings or Full settings.
- Set one accessible button label.
- Hide the item in an empty window.

## Consequences

The old separate colored chip is removed. Workspace color remains visible in painted chrome and in the full panel preview; text/icon/tooltip remain usable in high contrast.
